import config from "../../config.ts";

import {
	Document,
	storageContextFromDefaults,
	VectorStoreIndex,
} from "llamaindex";

/**
 * Creates a new collection for the specified user.
 * 
 * @param {string} userId - The ID of the user creating the collection.
 * @param {string} collectionName - The name of the collection to create.
 * @returns {Promise<string>} - A promise resolving to the ID of the created document.
 */
async function createCollection(userId: string, collectionName: string) {
	try {
		// Generate a unique ID for the document
		// @ts-ignore
		const doc_id = Bun.randomUUIDv7();
		// Initialize the file contents and create a test document
		const fileContents = "a";
		const testDoc = new Document({
			text: fileContents,
			metadata: {
				doc_id: doc_id,
				doc_file: "test.txt",
				user: userId,
			},
		});

		// Set the collection name in the pgvs configuration
		config.pgvs.setCollection(collectionName);

		// Create a storage context from the default configuration
		const ctx = await storageContextFromDefaults({ vectorStore: config.pgvs });
		// Create a VectorStoreIndex from the test document
		await VectorStoreIndex.fromDocuments([testDoc], {
			storageContext: ctx,
		});
		// Return the ID of the created document
		return doc_id;
	} catch (error: any) {
		// Log any errors that occur during collection creation
		console.error("Error creating collection:", error.message);
		return "";
	}
}

/**
 * Deletes a collection based on the provided collection name.
 * 
 * @param {string} collectionName - The name of the collection to delete.
 * @returns {void} - No return value, the function deletes the collection asynchronously.
 */
async function deleteCollection(collectionName: string) {
	// Query the database for documents in the specified collection
	const { data, error: lookupError } = await config.supabaseClient
		.from("llamaindex_embedding")
		.select("id, collection")
		.eq("collection", collectionName);

	// If no documents are found or an error occurs, exit the function
	if (!data || data.length === 0)
		return;
	if (lookupError)
		return;

	// Iterate over the documents and delete each one
	for (const item of data) {
		// Delete the document by ID
		const { error: deleteError } = await config.supabaseClient
			.from("llamaindex_embedding")
			.delete()
			.eq("id", item.id);

		// If an error occurs during deletion, exit the function
		if (deleteError)
			return;
	}
}

export { createCollection, deleteCollection };
