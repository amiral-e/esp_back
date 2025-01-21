import config from "../config.ts";
import AuthMiddleware from "../middlewares/middleware_auth.ts";
import { Hono } from "hono";

const documents_get = new Hono();

documents_get.get(
	"/:collection_name/documents",
	AuthMiddleware,
	async (c: any) => {
		const user = c.get("user");
		const { collection_name } = c.req.param();
		const table_name = user.uid + "_" + collection_name;

		const { data, error } = await config.supabaseClient
			.schema("vecs")
			.from(table_name)
			.select("*");
		if (data == undefined || data.length == 0)
			return c.json({ error: "Collection not found" }, 404);
		else if (error) return c.json({ error: error.message }, 500);

		const docs = data.map((x: any) => ({ doc_id: x.metadata.doc_id, filename: x.metadata.filename }));
		const uniqueDocs = docs.filter((doc: any, index: any, self: any) =>
			index === self.findIndex((t: any) => (t.doc_id === doc.doc_id))
		);
		return c.json({ response: { docs: uniqueDocs } }, 200);
	},
);

export default documents_get;
