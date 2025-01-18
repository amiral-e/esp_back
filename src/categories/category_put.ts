import config from "../config.ts";
import AdminMiddleware from "../middlewares/middleware_admin.ts";
import { Hono } from "hono";

const category_put = new Hono();

category_put.put("/:id", AdminMiddleware, async (c: any) => {
	const { id } = await c.req.param();
	let json: any;
	try {
		json = await c.req.json();
		if (!json || (json.name == undefined && json.description == undefined))
			return c.json({ error: "Invalid JSON" }, 400);
	} catch (error) {
		return c.json({ error: "Invalid JSON" }, 400);
	}

	const { data: categData, error: categError } = await config.supabaseClient
		.from("categories")
		.select("name")
		.eq("id", id)
		.single();
	if (categData == undefined || categData.length == 0)
		return c.json({ error: "Category not found" }, 404);
	else if (categError != undefined)
		return c.json({ error: categError.message }, 500);

	const { data: updateData, error: updateError } = await config.supabaseClient
		.from("categories")
		.update(json)
		.eq("id", id)
		.select();
	if (updateError != undefined)
		return c.json({ error: updateError.message }, 500);
	return c.json(
		{ response: `Category ${categData.name} updated successfully` },
		200,
	);
});

export default category_put;
