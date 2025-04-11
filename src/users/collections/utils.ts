import config from "../../config.ts";

import {
	Document,
	storageContextFromDefaults,
	VectorStoreIndex,
} from "llamaindex";

async function createCollection(userId: string, collectionName: string) {
	try {
		// Create a test document
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

		// Set up vector store
		config.pgvs.setCollection(collectionName);

		// Create storage context and index
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

async function deleteCollections(userId: string) {
	const { data: total_data, error: lookupTotalError } = await config.supabaseClient
		.from("llamaindex_embedding")
		.select("collection")
		.like("collection", userId + "_%");
	if (lookupTotalError != undefined) {
		throw new Error("Error while looking for collections");
	}

	for (const item of total_data) {
		const { data, error: deleteError } = await config.supabaseClient
			.from("llamaindex_embedding")
			.delete()
			.eq("collection", item.collection);

		if (deleteError != undefined) {
			throw new Error("Error while deleting collection");
		}
		for (const item of data) {
			const { error: deleteError } = await config.supabaseClient
				.from("llamaindex_embedding")
				.delete()
				.eq("id", item.id);
	
			if (deleteError != undefined) {
				throw new Error("Error while deleting embeddings");
			}
		}
	}
}

export { createCollection, deleteCollection, deleteCollections };
