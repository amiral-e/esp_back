import config from "../../config.ts";
import { getUser } from "../../middlewares/utils.ts";

import {
	Document,
	storageContextFromDefaults,
	VectorStoreIndex,
} from "llamaindex";

async function createGlobalCollection(userId: string, collectionName: string) {
	try {
        const user = await getUser(userId);
        if (!user.admin)
            return "";

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
		const index = await VectorStoreIndex.fromDocuments([testDoc], {
			storageContext: ctx,
		});
		return doc_id;
	} catch (error: any) {
		console.error("Error creating collection:", error.message);
		return "";
	}
}

async function deleteGlobalCollection(userId: string, collectionName: string) {
	const user = await getUser(userId);
    if (!user.admin)
        return false;

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

export { createGlobalCollection, deleteGlobalCollection };