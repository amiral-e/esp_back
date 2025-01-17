import config from "../config";
import AuthMiddleware from "../middlewares";
import { Hono } from "hono";

const conversation_delete = new Hono();

conversation_delete.delete("/:conv_id", AuthMiddleware, async (c: any) => {
	const user = c.get("user");
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

	const { data: deletedConv, error: deleteError } = await config.supabaseClient
		.from("conversations")
		.delete()
		.eq("id", convData.id);
	if (deleteError != undefined)
		return c.json({ error: deleteError.message }, 500);
	return c.json(
		{ message: `Conversation ${conv_id} deleted successfully` },
		200,
	);
});

export default conversation_delete;
