import config from "../config.ts";
import AdminMiddleware from "../middlewares/middleware_admin.ts";
import { Hono } from "hono";

const category_post = new Hono();

category_post.post("/", AdminMiddleware, async (c) => {
	let json: any;
	try {
		json = await c.req.json();
		if (!json || json.name == undefined || json.description == undefined)
			return c.json({ error: "Invalid JSON" }, 400);
	} catch (error) {
		return c.json({ error: "Invalid JSON" }, 400);
	}

	const { data, error } = await config.supabaseClient
		.from("categories")
		.insert(json)
		.select();
	if (error != undefined) return c.json({ error: error.message }, 500);
	return c.json(
		{ response: `Category ${json.name} created successfully` },
		200,
	);
});

export default category_post;
