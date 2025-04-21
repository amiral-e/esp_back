import config from "../../config.ts";

/**
 * Retrieves a list of collections.
 * 
 * @param c The context object.
 * @returns A JSON response with the list of collections.
 */
async function get_collections(c: any) {
	const collections = await config.supabaseClient
		.from("llamaindex_embedding")
		.select("collection")
		.like("collection", "global_%");
	if (collections.data == undefined || collections.data.length == 0)
		return c.json({ error: "No collection found" }, 404);
	else if (collections.error != undefined)
		return c.json({ error: collections.error.message }, 500);

	const uniqueCollections = collections.data.filter(
		(collection: any, index: any, self: any) =>
			index ===
			self.findIndex((t: any) => t.collection === collection.collection),
	);
	return c.json(
		{
			collections: [
				...new Set(
					uniqueCollections.map((x: any) => {
						const collection_id = x.collection;
						const name = collection_id.replace("global_", "");
						return { collection: collection_id, user: "global", name: name };
					}),
				),
			],
		},
		200,
	);
}

export default get_collections;
