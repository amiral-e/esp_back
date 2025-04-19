import config from "../../config.ts";
import { VectorStoreIndex } from "llamaindex";

import { add_context_to_query, get_knowledge_prompt } from "./utils.ts";
import { decrease_credits, check_credits } from "../profile/utils.ts";

function get_context_prompt(texts: string, query: string): string {
	const context_prompt = `Context information is below.
---------------------
${texts}
---------------------
Given the context information and not prior knowledge, answer the query.
Your answer should be in the same language as the query.
You can't return the full context directly, but you can summarize it, or use it to answer the query.

Query: ${query}
Answer:`;

	return context_prompt;
}

async function validate_json(c: any) {
	let json: any;

	try {
		json = await c.req.json();
		if (
			json?.message == undefined ||
			json?.message == "" ||
			json?.collections == undefined ||
			json?.collections.length == 0
		)
			return { error: "Invalid JSON" };
	} catch (error) {
		return { error: "Invalid JSON" };
	}
	return json;
}

async function set_messages_history(
	c: any,
	conversation: any,
	json: any,
	uid: string,
) {
	const knowledge_prompt = await get_knowledge_prompt(uid);

	const res = await add_context_to_query(
		conversation.data.history,
		json.message,
	);

	let docs = [];
	for (const collec_name of json.collections) {
		config.pgvs.setCollection(collec_name);
		const index = await VectorStoreIndex.fromVectorStore(config.pgvs);

		const retriever = index.asRetriever({
			similarityTopK: 3,
		});
		docs.push({
			collection_name: collec_name,
			sources: await retriever.retrieve({ query: res }),
		});
	}
	if (docs.length == 0) return { error: "No answer found", status: 404 };

	let texts = "";
	for (const doc of docs) {
		texts += "collection: " + doc.collection_name + "\n\n";
		for (const source of doc.sources) {
			texts += source.node.metadata.doc_file + ":\n";
			// @ts-ignore
			texts += source.node.text + "\n\n";
		}
	}
	return { prompt: knowledge_prompt, res: res, texts: texts, docs: docs };
}

async function update_credits(
	uid: string,
	input_tokens: number,
	output_tokens: number,
) {
	const increment_total_messages = await config.supabaseClient.rpc(
		"increment_total_messages",
		{ p_user_id: uid },
	);
	if (increment_total_messages.error != undefined)
		return { error: increment_total_messages.error.message, status: 500 };

	const input_result = await decrease_credits(input_tokens, uid, "groq_input");
	if (input_result != "Success") return { error: input_result, status: 500 };

	const output_result = await decrease_credits(
		output_tokens,
		uid,
		"groq_output",
	);
	if (output_result != "Success") return { error: output_result, status: 500 };

	const query_result = await decrease_credits(1, uid, "search");
	if (query_result != "Success") return { error: query_result, status: 500 };
	return { result: "Success" };
}

async function update_conv_history(
	conversation: any,
	json: any,
	response: any,
	docs: any,
) {
	let sources_details = [];
	for (const doc of docs) {
		const details = doc.sources.map((x: any) => {
			return {
				part: x.node.id_,
				metadata: x.node.metadata,
				score: x.score,
			};
		});
		sources_details.push({
			collection: doc.collection_name,
			documents: details,
		});
	}

	let source_save = [];
	for (const source of sources_details) {
		source_save.push({
			collection: source.collection,
			documents: source.documents.map((x: any) => x.metadata.doc_file),
		});
	}

	conversation.data.history = conversation.data.history.slice(1);
	conversation.data.history.push({ role: "user", content: json.message });
	conversation.data.history.push({
		role: "assistant",
		content: response.message.content,
		sources: source_save,
	});

	const update = await config.supabaseClient
		.from("conversations")
		.update({ history: conversation.data.history })
		.eq("id", conversation.data.id);
	if (update.error) return { error: update.error.message, status: 500 };

	return { source: sources_details };
}

async function post_chat_with_collection(c: any) {
	const user = c.get("user");

	let json = await validate_json(c);
	if (json.error != undefined) return c.json({ error: json.error }, 400);

	const input_tokens = json.message.length;
	const validate_credits = await check_credits(
		input_tokens,
		user.uid,
		true,
		false,
	);
	if (validate_credits != "Success")
		return c.json({ error: "Not enough credits" }, 402);

	const { conv_id } = c.req.param();
	for (const collec_name of json.collections) {
		if (
			!collec_name.startsWith("global_") &&
			!collec_name.startsWith(user.uid + "_")
		)
			return c.json({ error: "Invalid collection name" }, 400);
	}

	if (json.collections.length > 3)
		return c.json({ error: "Too many collections, 3 collections max" }, 400);

	const conversation = await config.supabaseClient
		.from("conversations")
		.select("*")
		.eq("user_id", user.uid)
		.eq("id", conv_id)
		.single();
	if (conversation.data == undefined || conversation.data.length == 0)
		return c.json({ error: "Conversation not found" }, 404);

	const elems = await set_messages_history(c, conversation, json, user.uid);
	if (elems.error != undefined)
		return c.json({ error: elems.error }, elems.status);

	let response: any;
	try {
		response = await config.llm.chat({
			messages: [
				{ role: "system", content: elems.prompt },
				{ role: "user", content: get_context_prompt(elems.texts, elems.res) },
			],
		});
	} catch (error: any) {
		console.error("LLM Error:", error instanceof Error ? error.message : error);
		if (error.message?.toLowerCase().includes("rate_limit_exceeded"))
			console.log("Hit rate limit. Consider implementing retry logic.");
	}
	const output_tokens = response.message.content.length;

	const update_credits_result = await update_credits(
		user.uid,
		input_tokens,
		output_tokens,
	);
	if (update_credits_result.error != undefined)
		return c.json(
			{ error: update_credits_result.error },
			update_credits_result.status,
		);

	const update_history_result = await update_conv_history(
		conversation,
		json,
		response,
		elems.docs,
	);
	if (update_history_result.error != undefined)
		return c.json(
			{ error: update_history_result.error },
			update_history_result.status,
		);

	return c.json(
		{
			role: "assistant",
			content: response.message.content,
			sources: update_history_result.source,
		},
		200,
	);
}

export default post_chat_with_collection;
