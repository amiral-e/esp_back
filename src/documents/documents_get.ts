import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../config.ts";
import AuthMiddleware from "../middlewares/middleware_auth.ts";

const documents_get = new Hono();

documents_get.get(
	"/:collection_name/documents",
	AuthMiddleware,
	async (c: any) => {
		const user = c.get("user");
		const { collection_name } = c.req.param();
		const collection_id = user.uid + "_" + collection_name;

		const { data, error } = await config.supabaseClient
			.from("llamaindex_embedding")
			.select("id, collection, metadata")
			.eq("collection", collection_id);
		if (data == undefined || data.length == 0)
			return c.json({ error: "Collection not found" }, 404);
		else if (error != undefined) return c.json({ error: error.message }, 500);

		const docs = data.reduce((acc: any[], x: any) => {
			if (!acc.some((y) => y.doc_id === x.metadata.doc_id)) {
				acc.push({ doc_id: x.metadata.doc_id, doc_file: x.metadata.doc_file });
			}
			return acc;
		}, []);
		return c.json({ documents: docs }, 200);
	},
);

export default documents_get;
