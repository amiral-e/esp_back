import config from "../../config.ts";

/**
 * Retrieves a list of collections for the current user.
 * 
 * @param {any} c - The context object containing the user.
 * @returns {Promise<any>} - A promise resolving to a JSON response containing the list of collections.
 */
async function get_collections(c: any) {
	const user = c.get("user");

	const { data, error } = await config.supabaseClient
		.from("llamaindex_embedding")
		.select("collection")
		.like("collection", user.uid + "_%");
	if (data == undefined || data.length == 0)
		return c.json({ error: "No collections found" }, 404);
	else if (error != undefined) return c.json({ error: error.message }, 500);

	const uniqueCollections = data.filter(
		(collection: any, index: any, self: any) =>
			index ===
			self.findIndex((t: any) => t.collection === collection.collection),
	);
	const collections = [
		...new Set(
			uniqueCollections.map((x: any) => {
				const collection_id = x.collection;
				const name = collection_id.replace(user.uid + "_", "");
				return { collection: collection_id, user: user.uid, name: name };
			}),
		),
	];
	return c.json({ collections: collections }, 200);
}

export default get_collections;
