import config from "../../config.ts";

import {
	Document,
	storageContextFromDefaults,
	VectorStoreIndex,
} from "llamaindex";

async function createCollection(userId: string, collectionName: string) {
	try {
		// Create a test document
		const fileContents = "a";
		const testDoc = new Document({
			text: fileContents,
			metadata: {
				// @ts-ignore
				doc_id: Bun.randomUUIDv7(),
				doc_file: "test.txt",
				user: userId,
			},
		});

		// Set up vector store
		config.pgvs.setCollection(collectionName);

		// Create storage context and index
		const ctx = await storageContextFromDefaults({ vectorStore: config.pgvs });
		const index = await VectorStoreIndex.fromDocuments([testDoc], {
			storageContext: ctx,
		});
	} catch (error: any) {
		console.error("Error creating collection:", error.message);
		return false;
	}
}

async function deleteCollection(collectionName: string) {
	const { data, error: lookupError } = await config.supabaseClient
		.from("llamaindex_embedding")
		.select("id, collection")
		.eq("collection", collectionName);

	if (!data || data.length === 0) {
		throw new Error("Collection not found");
	}
	if (lookupError) {
		throw lookupError;
	}

	// Delete all embeddings in the collection
	for (const item of data) {
		const { error: deleteError } = await config.supabaseClient
			.from("llamaindex_embedding")
			.delete()
			.eq("id", item.id);

		if (deleteError) {
			throw deleteError;
		}
	}
}

export { createCollection, deleteCollection };
