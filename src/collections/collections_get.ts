import config from "../config";
import AuthMiddleware from "../middlewares";
import { Hono } from "hono";

const collections_get = new Hono();

collections_get.get(AuthMiddleware, async (c: any) => {
	const user = c.get("user");

	const { data, error } = await config.supabaseClient
		.schema("vecs")
		.rpc("get_vecs", { name: user.uid + "%" });
	if (data == undefined || error != undefined)
		return c.json({ error: error.message }, 500);

	const collections = data.map((item: any) => {
		const tableName = item.vec_table_name;
		const name = tableName.replace(user.uid + "_", "");
		return { table_name: tableName, name: name };
	});
	return c.json({ collections: collections }, 200);
});

export default collections_get;
