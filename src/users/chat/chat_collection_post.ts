import config from "../../config.ts";
import { VectorStoreIndex } from "llamaindex";

import { add_context_to_query, get_knowledge_prompt } from "./utils.ts";
import { decrease_credits, check_credits } from "../profile/utils.ts";

/**
 * Generates a context prompt based on the provided texts and query.
 * 
 * @param texts The context information.
 * @param query The query to answer.
 * @returns The generated context prompt.
 */
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

/**
 * Validates the JSON object sent in the request.
 * 
 * @param c The request object.
 * @returns The validated JSON object or an error object if the JSON is invalid.
 */
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

/**
 * Sets the message history for the conversation.
 * 
 * @param c The request object.
 * @param conversation The conversation object.
 * @param json The JSON object containing the message and collections.
 * @param uid The user ID.
 * @returns An object containing the prompt, response, texts, and documents.
 */
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

/**
 * Updates the credits for the user based on the input and output tokens.
 * 
 * @param uid The user ID.
 * @param input_tokens The number of input tokens.
 * @param output_tokens The number of output tokens.
 * @returns An object containing the result of the credit update operation.
 */
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

/**
 * Updates the conversation history with the new message and response.
 * 
 * @param conversation The conversation object.
 * @param json The JSON object containing the message and collections.
 * @param response The response object.
 * @param docs The documents object.
 * @returns An object containing the updated conversation history.
 */
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

/**
 * Handles the chat with collection API request.
 * 
 * @param c The request object.
 * @returns A response object containing the chat result or an error.
 */
async function post_chat_with_collection(c: any) {
	const user = c.get("user");

	let json = await validate_json(c);
	if (json.error != undefined) return c.json({ error: json.error }, 400);

	const { conv_id } = c.req.param();
	const conversation = await config.supabaseClient
		.from("conversations")
		.select("*")
		.eq("user_id", user.uid)
		.eq("id", conv_id)
		.single();
	if (conversation.data == undefined || conversation.data.length == 0)
		return c.json({ error: "Conversation not found" }, 404);

	const input_tokens = json.message.length;
	const validate_credits = await check_credits(
		input_tokens,
		user.uid,
		true,
		false,
	);
	if (validate_credits != "Success")
		return c.json({ error: "Not enough credits" }, 402);

	const isValidCollection = validateCollection(json.collections, user.uid);
	if (!isValidCollection)
		return c.json({ error: "Invalid collection name" }, 400);

	const elems = await set_messages_history(c, conversation, json, user.uid);
	if (elems.error != undefined)
		return c.json({ error: elems.error }, elems.status);

	const response = await getResponse(elems);
	if (!response) 
	  return c.json({ error: "Failed to get response from LLM" }, 500);

	const output_tokens = response.message.content.length;

	const creditsResult = await update_credits(
		user.uid,
		input_tokens,
		output_tokens,
	);
	if (creditsResult.error != undefined)
		return c.json(
			{ error: creditsResult.error },
			creditsResult.status,
		);

	const historyResult = await update_conv_history(
		conversation,
		json,
		response,
		elems.docs,
	);
	if (historyResult.error != undefined)
		return c.json(
			{ error: historyResult.error },
			historyResult.status,
		);

	return c.json(
		{
			role: "assistant",
			content: response.message.content,
			sources: historyResult.source,
		},
		200,
	);
}

/**
 * Validates the collection names.
 * 
 * @param collections The collection names.
 * @param uid The user ID.
 * @returns True if the collections are valid, false otherwise.
 */
function validateCollection(collections: any, uid: string) {
	for (const collec_name of collections) {
		if (
			!collec_name.startsWith("global_") &&
			!collec_name.startsWith(uid + "_")
		)
			return false;
	}
	return collections.length <= 3;
}

/**
 * Gets a response from the LLM.
 * 
 * @param elems The elements to send to the LLM.
 * @returns The response from the LLM or null if an error occurs.
 */
async function getResponse(elems: any) {
	try {
		return await config.llm.chat({
			messages: [
				{ role: "system", content: elems.prompt },
				{ role: "user", content: get_context_prompt(elems.texts, elems.res) },
			],
		});
	} catch (error: any) {
		console.error("LLM Error:", error instanceof Error ? error.message : error);
		if (error.message?.toLowerCase().includes("rate_limit_exceeded"))
			console.log("Hit rate limit. Consider implementing retry logic.");
		return null;
	}
}

export default post_chat_with_collection;