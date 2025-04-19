import config from "../../config.ts";

async function get_conversation(c: any) {
	const user = c.get("user");
	const { conv_id } = c.req.param();

	const conversation = await config.supabaseClient
		.from("conversations")
		.select("*")
		.eq("user_id", user.uid)
		.eq("id", conv_id)
		.single();
	if (conversation.data == undefined || conversation.data.length == 0)
		return c.json({ error: "Conversation not found" }, 404);

	return c.json(
		{
			name: conversation.data.name,
			history: conversation.data.history,
			id: conversation.data.id,
		},
		200,
	);
}

export default get_conversation;
