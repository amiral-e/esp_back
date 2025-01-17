import config from "../config.ts";
import AdminMiddleware from "../middlewares.ts";
import { Hono } from "hono";

const category_delete = new Hono();

category_delete.delete("/:id", AdminMiddleware, async (c: any) => {
	const { id } = await c.req.param();

	const { data: categData, error: categError } = await config.supabaseClient
		.from("categories")
		.select("*")
		.eq("id", id)
		.single();
	if (categData == undefined || categData.length == 0)
		return c.json({ error: "Category not found" }, 404);
	if (categError != undefined)
		return c.json({ error: categError.message }, 500);

	const { data: delData, error: delError } = await config.supabaseClient
		.from("categories")
		.delete()
		.eq("id", id)
		.select();
	if (delError != undefined) return c.json({ error: delError.message }, 500);
	return c.json(
		{ response: `Category ${categData.name} deleted successfully` },
		200,
	);
});

export default category_delete;
