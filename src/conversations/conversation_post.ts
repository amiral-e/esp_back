import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../config.ts";
import AuthMiddleware from "../middlewares/middleware_auth.ts";

const conversation_post = new Hono();

conversation_post.post("/", AuthMiddleware, async (c: any) => {
	const user = c.get("user");

	let json: any;
	try {
		json = await c.req.json();
		if (!json || json.name == undefined || json.description == undefined)
			return c.json({ error: "Invalid JSON" }, 400);
	} catch (error) {
		return c.json({ error: "Invalid JSON" }, 400);
	}

	const { data, error } = await config.supabaseClient
		.from("conversations")
		.insert({ history: [], name: json.name, user_id: user.uid })
		.select("*")
		.single();
	if (data == undefined || error != undefined)
		return c.json({ error: error.message }, 500);
	return c.json(
		{
			message: `Conversation ${json.name} created successfully with id ${data.id}`,
		},
		200,
	);
});

export default conversation_post;
