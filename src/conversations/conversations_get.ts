import config from "../config";
import AuthMiddleware from "../middlewares";
import { Hono } from "hono";

const conversations_get = new Hono();

conversations_get.get(AuthMiddleware, async (c: any) => {
	const user = c.get("user");

	const { data, error } = await config.supabaseClient
		.from("conversations")
		.select("*")
		.eq("user_id", user.uid);
	if (data == undefined || data.length == 0)
		return c.json({ error: "No conversations found" }, 404);
	else if (error != undefined) return c.json({ error: error.message }, 500);
	return c.json({ conversations: data }, 200);
});

export default conversations_get;
