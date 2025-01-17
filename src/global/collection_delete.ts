import config from "../config.ts";
import AdminMiddleware from "../middlewares.ts";
import { Hono } from "hono";

const collection_delete = new Hono();

collection_delete.delete(
	"/collections/:collection_name",
	AdminMiddleware,
	async (c: any) => {
		// const user = c.get('user');
		const { collection_name } = c.req.param();

		const { data: collectionData, error: collectionError } =
			await config.supabaseClient
				.schema("vecs")
				.rpc("get_vecs", { name: "global_" + collection_name });
		if (collectionData == undefined || collectionData.length == 0)
			return c.json({ error: "Collection not found" }, 404);
		else if (collectionError != undefined)
			return c.json({ error: collectionError.message }, 500);

		const { data: deletedCollection, error: deleteError } =
			await config.supabaseClient
				.schema("vecs")
				.rpc("drop_table_if_exists", {
					table_name: "global_" + collection_name,
				});
		if (deleteError != undefined)
			return c.json({ error: deleteError.message }, 500);
		return c.json(
			{ message: `Collection ${collection_name} deleted successfully` },
			200,
		);
	},
);

export default collection_delete;
