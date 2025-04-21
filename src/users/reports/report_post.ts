import config from "../../config.ts";

import { VectorStoreIndex } from "llamaindex";
import { decrease_credits, check_credits } from "../profile/utils.ts";
import { get_report_prompt, process_query } from "./utils.ts";

/**
 * Validates the JSON payload for the report.
 * 
 * @param {any} c - The controller object.
 * @returns {Promise<any>} A promise that resolves with the validated JSON data.
 */
async function validate_json(c: any) {
	let json: any;

	try {
		// Attempt to parse the JSON payload from the request
		json = await c.req.json();
		// Check if the title and prompt are present in the JSON payload
		if (json?.title == undefined || json?.prompt == undefined)
			return { error: "Invalid JSON", status: 400 };
	} catch (error) {
		// If there's an error parsing the JSON, return an error response
		return { error: "Invalid JSON", status: 400 };
	}
	// Set default values for documents and collection_name if they're missing
	if (json?.documents == undefined) json.documents = [];
	if (json?.collection_name == undefined) json.collection_name = "";
	return json;
}

/**
 * Processes the documents for the report.
 * 
 * @param {any} c - The controller object.
 * @param {any} json - The JSON data for the report.
 * @param {string} uid - The user ID.
 * @param {number} input_tokens - The number of input tokens.
 * @returns {Promise<any>} A promise that resolves with the processed documents.
 */
async function process_documents(
	c: any,
	json: any,
	uid: string,
	input_tokens: number,
) {
	let texts = "";
	// Check if a collection name is specified in the JSON payload
	if (json.collection_name != "") {
		// Process the query to retrieve relevant documents
		const processed_query = await process_query(json.prompt);

		// Check if the query requires a search
		if (processed_query != "no search needed") {
			let docs = [];
			// Set the collection in the vector store
			config.pgvs.setCollection(json.collection_name);
			// Create a vector store index
			const index = await VectorStoreIndex.fromVectorStore(config.pgvs);

			// Create a retriever to fetch documents based on the query
			const retriever = index.asRetriever({
				similarityTopK: 3,
			});
			// Retrieve documents
			docs.push({
				collection_name: json.collection_name,
				sources: await retriever.retrieve({ query: processed_query }),
			});
			// Check if any documents were found
			if (docs.length == 0) return { error: "No answer found", status: 404 };

			// Iterate through the documents and construct a text summary
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

/**
 * Processes the model response for the report.
 * 
 * @param {any} c - The controller object.
 * @param {any} json - The JSON data for the report.
 * @param {any} texts - The processed documents.
 * @returns {Promise<any>} A promise that resolves with the model response.
 */
async function process_model_response(c: any, json: any, texts: any) {
	// Get the report prompt
	const report_prompt = await get_report_prompt();
	// Initialize the conversation history with the report prompt
	let history = [{ role: "system", content: report_prompt }];

	let content = "";
	// Check if there are any processed documents to include in the conversation
	if (texts != undefined && texts.trim() != "")
		content += "## Context:\n" + texts;
	// Check if there are any user-supplied documents to include in the conversation
	if (json.documents && json.documents.length > 0) {
		content += "\n## User's documents:";
		for (const [i, doc] of json.documents.entries())
			content += `\n\nDoc ${i + 1}:\n` + doc;
	}

	// Add the user's input to the conversation history
	history.push({ role: "user", content: content });

	let response: any;
	try {
		// Send the conversation history to the model for a response
		response = await config.llm.chat({
			messages: JSON.parse(JSON.stringify(history)),
		});
	} catch (error: any) {
		// Log any errors that occur during the model interaction
		console.error("LLM Error:", error instanceof Error ? error.message : error);
		// Check if the error is due to rate limiting
		if (error.message?.toLowerCase().includes("rate_limit_exceeded")) {
			console.log("Hit rate limit. Consider implementing retry logic.");
			return { error: "Rate limit exceeded", status: 500 };
		}
		// Return an error response for other errors
		return { error: "Failed to process message", status: 500 };
	}
	return response;
}

/**
 * Updates the user credits after processing the report.
 * 
 * @param {string} uid - The user ID.
 * @param {number} input_tokens - The number of input tokens.
 * @param {any} json - The JSON data for the report.
 * @param {any} response - The model response.
 * @returns {Promise<any>} A promise that resolves with the result of the credit update.
 */
async function update_credits(
	uid: string,
	input_tokens: number,
	json: any,
	response: any,
) {
	// Insert a new report into the database
	const result = await config.supabaseClient
		.from("reports")
		.insert({ user_id: uid, title: json.title, text: response.message.content })
		.select("id")
		.single();
	// Check if there was an error inserting the report
	if (result.error) return { error: result.error.message, status: 500 };

	// Increment the total reports count for the user
	const increment_total_reports = await config.supabaseClient.rpc(
		"increment_total_reports",
		{ p_user_id: uid },
	);
	// Check if there was an error incrementing the reports count
	if (increment_total_reports.error != undefined)
		return { error: increment_total_reports.error.message, status: 500 };

	// Decrease the user's input credits
	const input_results = await decrease_credits(input_tokens, uid, "groq_input");
	// Check if there was an error decreasing the input credits
	if (input_results != "Success") return { error: input_results, status: 500 };

	// Decrease the user's output credits
	const output_results = await decrease_credits(
		response.message.content.length,
		uid,
		"groq_output",
	);
	// Check if there was an error decreasing the output credits
	if (output_results != "Success")
		return { error: output_results, status: 500 };
	return { result: "Success", id: result.data.id };
}

/**
 * Posts a new report.
 * 
 * @param {any} c - The controller object.
 * @returns {Promise<void>} A promise that resolves with the report data.
 */
async function post_report(c: any) {
	// Get the user object from the controller
	const user = c.get("user");

	// Validate the JSON payload
	let json = await validate_json(c);
	// Check if the validation failed
	if (json.error != undefined) return c.json({ error: json.error }, 400);

	// Calculate the total input tokens
	let size = 0;
	for (let doc of json.documents) size += doc.length;
	const input_tokens = size + json.prompt.length;

	// Check if the user has enough credits for the input
	const validate_credits = await check_credits(
		input_tokens,
		user.uid,
		false,
		false,
	);
	// Check if the user doesn't have enough credits
	if (validate_credits != "Success")
		return c.json({ error: "Not enough credits" }, 402);

	// Process the documents for the report
	const texts = await process_documents(c, json, user.uid, input_tokens);
	// Check if there was an error processing the documents
	if (texts.error != undefined)
		return c.json({ error: texts.error }, texts.status);

	// Process the model response for the report
	const response = await process_model_response(c, json, texts.texts);
	// Check if there was an error processing the model response
	if (response.error != undefined)
		return c.json({ error: response.error }, response.status);

	// Update the user's credits after processing the report
	const result = await update_credits(user.uid, input_tokens, json, response);
	// Check if there was an error updating the credits
	if (result.error != undefined) return c.json({ error: result.error }, 500);

	// Return the report data
	return c.json(
		{ title: json.title, text: response.message.content, id: result.id },
		200,
	);
}

export default post_report;