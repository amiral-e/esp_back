import config from "../../config.ts";

/**
 * Retrieves a conversation from the database.
 * 
 * @param {any} c - The context object containing the user and request parameters.
 * @returns {Promise<void>} A promise that resolves with a JSON response containing the conversation data or an error message.
 */
async function get_conversation(c: any) {
	// Retrieve the user object from the context
	const user = c.get("user");
	
	// Extract the conversation ID from the request parameters
	const { conv_id } = c.req.param();

	// Query the database for the conversation
	const conversation = await config.supabaseClient
		.from("conversations")
		.select("*")
		.eq("user_id", user.uid)
		.eq("id", conv_id)
		.single();
	
	// Check if the conversation was found
	if (conversation.data == undefined || conversation.data.length == 0)
		// Return a 404 error if the conversation was not found
		return c.json({ error: "Conversation not found" }, 404);

	// Return the conversation data as JSON
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