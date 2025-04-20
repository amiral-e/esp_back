import config from "../../config.ts";

import { VectorStoreIndex } from "llamaindex";
import { decrease_credits, check_credits } from "../profile/utils.ts";
import { get_report_prompt, process_query } from "./utils.ts";

async function validate_json(c: any) {
	let json: any;

	try {
		json = await c.req.json();
		if (json?.title == undefined || json?.prompt == undefined)
			return { error: "Invalid JSON", status: 400 };
	} catch (error) {
		return { error: "Invalid JSON", status: 400 };
	}
	if (json?.documents == undefined) json.documents = [];
	if (json?.collection_name == undefined) json.collection_name = "";
	return json;
}

async function process_documents(
	c: any,
	json: any,
	uid: string,
	input_tokens: number,
) {
	let texts = "";
	if (json.collection_name != "") {
		const processed_query = await process_query(json.prompt);

		if (processed_query != "no search needed") {
			let docs = [];
			config.pgvs.setCollection(json.collection_name);
			const index = await VectorStoreIndex.fromVectorStore(config.pgvs);

			const retriever = index.asRetriever({
				similarityTopK: 3,
			});
			docs.push({
				collection_name: json.collection_name,
				sources: await retriever.retrieve({ query: processed_query }),
			});
			if (docs.length == 0) return { error: "No answer found", status: 404 };

			for (const doc of docs) {
				texts += `collection '${doc.collection_name}': \n\n`;
				for (const source of doc.sources) {
					texts += source.node.metadata.doc_file + ":\n";
					// @ts-ignore
					texts += source.node.text + "\n\n";
				}
			}
		}
	}
	return { texts: texts };
}

async function process_model_response(c: any, json: any, texts: any) {
	const report_prompt = await get_report_prompt();
	let history = [{ role: "system", content: report_prompt }];

	let content = "";
	if (texts != undefined && texts.trim() != "")
		content += "## Context:\n" + texts;
	if (json.documents && json.documents.length > 0) {
		content += "\n## User's documents:";
		for (const [i, doc] of json.documents.entries())
			content += `\n\nDoc ${i + 1}:\n` + doc;
	}

	history.push({ role: "user", content: content });

	let response: any;
	try {
		response = await config.llm.chat({
			messages: JSON.parse(JSON.stringify(history)),
		});
	} catch (error: any) {
		console.error("LLM Error:", error instanceof Error ? error.message : error);
		if (error.message?.toLowerCase().includes("rate_limit_exceeded")) {
			console.log("Hit rate limit. Consider implementing retry logic.");
			return { error: "Rate limit exceeded", status: 500 };
		}
		return { error: "Failed to process message", status: 500 };
	}
	return response;
}

async function update_credits(
	uid: string,
	input_tokens: number,
	json: any,
	response: any,
) {
	const result = await config.supabaseClient
		.from("reports")
		.insert({ user_id: uid, title: json.title, text: response.message.content })
		.select("id")
		.single();
	if (result.error) return { error: result.error.message, status: 500 };

	const increment_total_reports = await config.supabaseClient.rpc(
		"increment_total_reports",
		{ p_user_id: uid },
	);
	if (increment_total_reports.error != undefined)
		return { error: increment_total_reports.error.message, status: 500 };

	const input_results = await decrease_credits(input_tokens, uid, "groq_input");
	if (input_results != "Success") return { error: input_results, status: 500 };

	const output_results = await decrease_credits(
		response.message.content.length,
		uid,
		"groq_output",
	);
	if (output_results != "Success")
		return { error: output_results, status: 500 };
	return { result: "Success", id: result.data.id };
}

async function post_report(c: any) {
	const user = c.get("user");

	let json = await validate_json(c);
	if (json.error != undefined) return c.json({ error: json.error }, 400);

	let size = 0;
	for (let doc of json.documents) size += doc.length;
	const input_tokens = size + json.prompt.length;

	const validate_credits = await check_credits(
		input_tokens,
		user.uid,
		false,
		false,
	);
	if (validate_credits != "Success")
		return c.json({ error: "Not enough credits" }, 402);

	const texts = await process_documents(c, json, user.uid, input_tokens);
	if (texts.error != undefined)
		return c.json({ error: texts.error }, texts.status);

	const response = await process_model_response(c, json, texts.texts);
	if (response.error != undefined)
		return c.json({ error: response.error }, response.status);

	const result = await update_credits(user.uid, input_tokens, json, response);
	if (result.error != undefined) return c.json({ error: result.error }, 500);

	return c.json(
		{ title: json.title, text: response.message.content, id: result.id },
		200,
	);
}

export default post_report;
