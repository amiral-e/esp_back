import config from "../../config.ts";

import {
	Document,
	storageContextFromDefaults,
	VectorStoreIndex,
} from "llamaindex";
const ALLOWED_FILE_TYPES = ["text/markdown", "text/plain;charset=utf-8"];

/**
 * Adds new documents to a specific collection.
 * 
 * @param {any} c The request context.
 * @param {string} c.req.param().collection_name The name of the collection.
 * @param {File} c.req.body The request containing the files to add.
 * @returns {Promise<any>} A promise that resolves with a JSON object containing a success message or an error.
 */
async function post_documents(c: any) {
	// Check if the user is an admin
	const user = c.get("user");
	if (!user.admin) return c.json({ error: "Forbidden" }, 403);

	// Extract the collection name from the request parameters
	const { collection_name } = c.req.param();

	let json: any;
	try {
		// Attempt to parse the request body as JSON
		json = await c.req.parseBody({ all: true });
	} catch (error) {
		// Return an error if the JSON is invalid
		return c.json({ error: "Invalid JSON" }, 400);
	}

	// Initialize an empty array to store the documents
	const docs: Document[] = [];
	for (const key in json) {
		// Get the file from the request body
		const file = json[key];
		if (file instanceof File) {
			// Check if the file type is allowed
			if (!ALLOWED_FILE_TYPES.includes(file.type)) {
				return c.json({ error: "File type not allowed" }, 400);
			}
			// Read the file contents as text
			const fileContents = await file.text();
			// Create a new document and add it to the array
			docs.push(
				new Document({
					text: fileContents,
					metadata: {
						// @ts-ignore
						doc_id: Bun.randomUUIDv7(),
						doc_file: file.name,
						user: "global",
					},
				}),
			);
		} else if (file instanceof Array)
			// Return an error if an array is provided (only single files are allowed)
			return c.json({ error: `Please provide a single file at a time` }, 400);
		else 
			// Return an error if the file is not a valid File object
			return c.json({ error: "Invalid JSON" }, 400);
	}
	// Check if any files were provided
	if (docs.length ==0) return c.json({ error: "No files provided" }, 400);

	// Set the collection in the PostgreSQL vector store
	config.pgvs.setCollection("global_" + collection_name);

	// Create a storage context from the defaults
	const ctx = await storageContextFromDefaults({ vectorStore: config.pgvs });
	// Create a vector store index from the documents
	await VectorStoreIndex.fromDocuments(docs, {
		storageContext: ctx,
	});

	// Increment the total documents count for the user
	await config.supabaseClient.rpc("increment_total_docs", {
		p_user_id: user.uid,
		p_docs_to_add: docs.length,
	});

	// Return a success message
	return c.json(
		{
			message: `You have ingested ${docs.length} documents into the collection ${collection_name}`,
		},
		200,
	);
}

export default post_documents;