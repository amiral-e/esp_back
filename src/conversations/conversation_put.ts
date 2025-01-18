import config from "../config.ts";
import AuthMiddleware from "../middlewares/middleware_auth.ts";
import { Hono } from "hono";

const conversation_put = new Hono();

conversation_put.put("/:conv_id", AuthMiddleware, async (c: any) => {
	const user = c.get("user");
	let json: any;
	try {
		json = await c.req.json();
		if (!json || json.name == undefined)
			return c.json({ error: "Invalid JSON" }, 400);
	} catch (error) {
		return c.json({ error: "Invalid JSON" }, 400);
	}
	const { conv_id } = c.req.param();

	const { data: convData, error: convError } = await config.supabaseClient
		.from("conversations")
		.select("*")
		.eq("user_id", user.uid)
		.eq("id", conv_id)
		.single();
	if (convData == undefined || convData.length == 0)
		return c.json({ error: "Conversation not found" }, 404);
	else if (convError != undefined)
		return c.json({ error: convError.message }, 500);

	const { data: updateData, error: updateError } = await config.supabaseClient
		.from("conversations")
		.update({ name: json.name })
		.eq("id", convData.id);
	if (updateError != undefined)
		return c.json({ error: updateError.message }, 500);
	return c.json(
		{ message: `Conversation ${convData.id} updated successfully` },
		200,
	);
});

export default conversation_put;
