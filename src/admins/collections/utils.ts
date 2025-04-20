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
		if (!user.admin) return "";

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

async function deleteGlobalCollection(userId: string, collectionName: string) {
	const user = await getUser(userId);
	if (!user.admin) return false;

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

async function deleteCollection(c: any, collection_id: string) {
	const collection = await config.supabaseClient
		.from("llamaindex_embedding")
		.select("id, collection")
		.eq("collection", collection_id);
	if (collection.data == undefined || collection.data.length == 0)
		return c.json({ error: "Collection not found" }, 404);
	else if (collection.error != undefined)
		return c.json({ error: collection.error.message }, 500);

	for (const item of collection.data) {
		const deletion = await config.supabaseClient
			.from("llamaindex_embedding")
			.delete()
			.eq("id", item.id);
		if (deletion.error != undefined)
			return c.json({ error: deletion.error.message }, 500);
	}

	return c.json({ message: `Collection deleted successfully` }, 200);
}

export { createGlobalCollection, deleteGlobalCollection, deleteCollection };
