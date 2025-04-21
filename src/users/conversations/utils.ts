import config from "../../config.ts";

/**
 * Creates a new conversation for the given user.
 * 
 * @param {string} userId - The ID of the user who owns the conversation.
 * @param {string} conversationName - The name of the conversation to create.
 * @returns {Promise<string | undefined>} - A promise that resolves with the ID of the created conversation.
 */
async function createConversation(userId: string, conversationName: string) {
	const { data, error } = await config.supabaseClient
		.from("conversations")
		.insert({
			history: [],
			name: conversationName,
			user_id: userId,
		})
		.select("*")
		.single();
	if (data == undefined || error != undefined) console.log(error.message);

	return data.id;
}

/**
 * Deletes a conversation for the given user.
 * 
 * @param {string} userId - The ID of the user who owns the conversation.
 * @param {string} convId - The ID of the conversation to delete.
 * @returns {Promise<void>} - A promise that resolves when the conversation is deleted.
 */
async function deleteConversation(userId: string, convId: string) {
	const { error } = await config.supabaseClient
		.from("conversations")
		.delete()
		.eq("id", convId)
		.eq("user_id", userId);

	if (error != undefined) console.log(error.message);
}

/**
 * Deletes all conversations for the given user.
 * 
 * @param {string} userId - The ID of the user who owns the conversations.
 * @returns {Promise<void>} - A promise that resolves when all conversations are deleted.
 */
async function deleteConversations(userId: string) {
	const { error } = await config.supabaseClient
		.from("conversations")
		.delete()
		.eq("user_id", userId);

	if (error != undefined) console.log(error.message);
}

export { createConversation, deleteConversation, deleteConversations };
