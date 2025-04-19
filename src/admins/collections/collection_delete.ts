import config from "../../config.ts";

async function delete_collection(c: any) {
	const user = c.get("user");
	if (!user.admin) return c.json({ error: "Forbidden" }, 403);

	const { collection_name } = c.req.param();
	const collection_id = "global_" + collection_name;

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

export default delete_collection;
