import config from "../../config.ts";

/**
 * Retrieves all conversations for the current user.
 * 
 * @param {any} c - The context object containing the user and request information.
 * @returns {Promise<void>} - A promise that resolves with the conversations response.
 */
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
