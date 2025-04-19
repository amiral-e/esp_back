import config from "../../config.ts";

async function delete_conversation(c: any) {
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

	const deletion = await config.supabaseClient
		.from("conversations")
		.delete()
		.eq("id", conversation.data.id);

	return c.json({ message: `Conversation deleted successfully` }, 200);
}

export default delete_conversation;
