import config from "../../config.ts";
import { decrease_credits, check_credits } from "../profile/utils.ts";

import {
	Document,
	storageContextFromDefaults,
	VectorStoreIndex,
} from "llamaindex";

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const ALLOWED_FILE_TYPES = ["text/markdown", "text/plain;charset=utf-8"];

/**
 * Process files from a JSON object and return a list of documents and tokens.
 * 
 * @param json The JSON object containing files to process.
 * @param user The user object.
 * @returns An object containing a list of documents, tokens, and an optional error message.
 */
async function processFiles(json: any, user: any): Promise<{ docs: Document[]; tokens: number; error?: string }> {
	// Initialize variables to keep track of the total tokens and documents
	let tokens = 0;
	const docs: Document[] = [];

	// Loop through each key in the JSON object
	for (const key in json) {
		const file = json[key];

		// Check if the file is an instance of File
		if (file instanceof File) {
			// Check if the file size exceeds the maximum allowed size
			if (file.size > MAX_FILE_SIZE) {
				// Return an error message if the file size exceeds the limit
				return { docs: [], tokens: 0, error: "File size exceeds limit" };
			}

			// Check if the file type is allowed
			if (!ALLOWED_FILE_TYPES.includes(file.type)) {
				// Return an error message if the file type is not allowed
				return { docs: [], tokens: 0, error: "File type not allowed" };
			}

			// Read the file contents as text
			const fileContents = await file.text();

			// Increment the total tokens by the length of the file contents
			tokens += fileContents.length;

			// Create a new Document object and add it to the list of documents
			docs.push(
				new Document({
					// Set the text of the document to the file contents
					text: fileContents,
					// Set the metadata of the document
					metadata: {
						// @ts-ignore
						// Generate a unique ID for the document
						doc_id: Bun.randomUUIDv7(),
						// Set the document file name
						doc_file: file.name,
						// Set the user ID
						user: user.uid,
					},
				}),
			);
		} 
		// Check if the file is an instance of Array
		else if (file instanceof Array)
			// Return an error message if the file is an array
			return { docs: [], tokens: 0, error: `Please provide a single file in ${key}` };
		// If the file is not an instance of File or Array, return an error message
		else return { docs: [], tokens: 0, error: "Invalid JSON" };
	}

	// Return the list of documents and the total tokens
	return { docs, tokens };
}

/**
 * Handle the post request to ingest documents into a collection.
 * 
 * @param c The request context.
 * @returns A JSON response with a message or an error.
 */
async function post_documents(c: any) {
	// Get the user object from the request context
	const user = c.get("user");

	// Get the collection name from the request parameters
	const { collection_name } = c.req.param();

	// Initialize a variable to store the JSON data
	let json: any;

	// Try to parse the request body as JSON
	try {
		json = await c.req.parseBody({ all: true });
	} catch (error) {
		// Return an error response if the JSON is invalid
		return c.json({ error: "Invalid JSON" }, 400);
	}

	// Process the files in the JSON data
	const result = await processFiles(json, user);

	// Check if there is an error in the result
	if (result.error) 
		// Return an error response if there is an error
		return c.json({ error: result.error }, 400);

	// Check if there are no documents in the result
	if (result.docs.length == 0) 
		// Return an error response if there are no documents
		return c.json({ error: "No files provided" }, 400);

	// Validate the user's credits
	const validate_credits = await check_credits(result.tokens, user.uid, false, true);

	// Check if the credit validation was successful
	if (validate_credits != "Success") 
		// Return an error response if the credit validation failed
		return c.json({ error: "Not enough credits" }, 402);

	// Set the collection in the config
	config.pgvs.setCollection(user.uid + "_" + collection_name);

	// Create a storage context
	const ctx = await storageContextFromDefaults({ vectorStore: config.pgvs });

	// Create a VectorStoreIndex from the documents
	await VectorStoreIndex.fromDocuments(result.docs, {
		// Set the storage context
		storageContext: ctx,
	});

	// Increment the total documents in the database
	const increment_total_docs = await config.supabaseClient
		.schema("public")
		.rpc("increment_total_docs", {
			// Set the user ID
			p_user_id: user.uid,
			// Set the number of documents to add
			p_docs_to_add: result.docs.length,
		});

	// Check if there is an error in the increment total documents response
	if (increment_total_docs.error != undefined) 
		// Return an error response if there is an error
		return c.json({ error: increment_total_docs.error.message }, 500);

	// Decrease the user's credits
	const credits = await decrease_credits(result.tokens, user.uid, "openai_embedding");

	// Check if the credit decrease was successful
	if (credits != "Success") 
		// Return an error response if the credit decrease failed
		return c.json({ error: credits }, 500);

	// Return a success response with a message
	return c.json(
		{
			// Set the message to indicate the number of documents ingested
			message: `You have ingested ${result.docs.length} documents into the collection ${collection_name}`,
		},
		200,
	);
}

export default post_documents;