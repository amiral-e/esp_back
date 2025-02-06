import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../config";
import AuthMiddleware from "../middlewares/middleware_auth.ts";

const collections_get = new Hono();

collections_get.get("/collections", AuthMiddleware, async (c: any) => {
	const user = c.get("user");

	const { data, error } = await config.supabaseClient
		.from("llamaindex_embedding")
		.select("collection")
		.like("collection", "global_%");
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
				const name = collection_id.replace("global_", "");
				return { collection: collection_id, user: user.uid, name: name };
			}),
		),
	];
	return c.json({ collections: collections }, 200);
});

export default collections_get;
