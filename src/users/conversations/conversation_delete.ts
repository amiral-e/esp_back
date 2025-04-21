import config from "../../config.ts";

/**
 * Deletes a conversation from the database.
 * 
 * @param {any} c - The context object containing the user and request parameters.
 * @returns {Promise<void>} A promise that resolves with a JSON response indicating the deletion result.
 */
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

	await config.supabaseClient
		.from("conversations")
		.delete()
		.eq("id", conversation.data.id);

	return c.json({ message: `Conversation deleted successfully` }, 200);
}

export default delete_conversation;
