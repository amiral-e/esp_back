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
		// @ts-ignore
		const doc_id = Bun.randomUUIDv7();
		const fileContents = "a";
		const testDoc = new Document({
			text: fileContents,
			metadata: {
				doc_id: doc_id,
				doc_file: "test.txt",
				user: userId,
			},
		});

		config.pgvs.setCollection(collectionName);

		const ctx = await storageContextFromDefaults({ vectorStore: config.pgvs });
		await VectorStoreIndex.fromDocuments([testDoc], {
			storageContext: ctx,
		});
		return doc_id;
	} catch (error: any) {
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
	const { data, error: lookupError } = await config.supabaseClient
		.from("llamaindex_embedding")
		.select("id, collection")
		.eq("collection", collectionName);

	if (!data || data.length === 0)
		return;
	if (lookupError)
		return;

	for (const item of data) {
		const { error: deleteError } = await config.supabaseClient
			.from("llamaindex_embedding")
			.delete()
			.eq("id", item.id);

		if (deleteError)
			return;
	}
	return;
}

export { createCollection, deleteCollection };
