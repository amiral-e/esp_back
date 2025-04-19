import config from "../../config.ts";

async function get_conversations(c: any) {
	const user = c.get("user");

	const conversations = await config.supabaseClient
		.from("conversations")
		.select("*")
		.eq("user_id", user.uid);
	if (conversations.data == undefined || conversations.data.length == 0)
		return c.json({ error: "No conversations found" }, 404);

	return c.json({ conversations: conversations.data }, 200);
}

export default get_conversations;
