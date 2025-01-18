import config from "../config.ts";
import AuthMiddleware from "../middlewares/middleware_auth.ts";
import { Hono } from "hono";

const categories_get = new Hono();

categories_get.get("/", AuthMiddleware, async (c) => {
	const { data, error } = await config.supabaseClient
		.from("categories")
		.select("*");
	if (data == undefined || data.length == 0)
		return c.json({ error: "No categories found" }, 404);
	else if (error != undefined) return c.json({ error: error.message }, 500);
	return c.json({ response: data }, 200);
});

export default categories_get;
