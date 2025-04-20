import config from "../../config.ts";
import { getUser } from "../../middlewares/utils.ts";
import { createCollection, deleteCollection } from "../../users/collections/utils.ts";

async function createGlobalCollection(userId: string, collectionName: string) {
	const user = await getUser(userId);
	if (!user.admin) return "";

	return await createCollection(userId, collectionName);
}

async function deleteGlobalCollection(userId: string, collectionName: string) {
	const user = await getUser(userId);
	if (!user.admin) return false;

	await deleteCollection(collectionName);
}

async function deleteCollectionHttp(c: any, collection_id: string) {
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

export { createGlobalCollection, deleteGlobalCollection, deleteCollectionHttp };
