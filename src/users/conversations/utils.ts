import config from "../../config.ts";

/**
 * Creates a new conversation for the given user.
 * 
 * @param {string} userId - The ID of the user who owns the conversation.
 * @param {string} conversationName - The name of the conversation to create.
 * @returns {Promise<string | undefined>} - A promise that resolves with the ID of the created conversation.
 */
async function createConversation(userId: string, conversationName: string) {
  // Insert a new conversation into the database
  const { data, error } = await config.supabaseClient
    .from("conversations")
    .insert({
      history: [], // Initialize the conversation history as an empty array
      name: conversationName, // Set the conversation name
      user_id: userId, // Set the user ID
    })
    .select("*") // Select all columns
    .single(); // Only return a single row
  // Check if there was an error or if the data is undefined
  if (data == undefined || error != undefined) console.log(error.message);

  // Return the ID of the created conversation
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
  // Delete the conversation from the database where the ID and user ID match
  const { error } = await config.supabaseClient
    .from("conversations")
    .delete() // Delete the conversation
    .eq("id", convId) // Match the conversation ID
    .eq("user_id", userId); // Match the user ID

  // Check if there was an error
  if (error != undefined) console.log(error.message);
}

/**
 * Deletes all conversations for the given user.
 * 
 * @param {string} userId - The ID of the user who owns the conversations.
 * @returns {Promise<void>} - A promise that resolves when all conversations are deleted.
 */
async function deleteConversations(userId: string) {
  // Delete all conversations from the database where the user ID matches
  const { error } = await config.supabaseClient
    .from("conversations")
    .delete() // Delete the conversations
    .eq("user_id", userId); // Match the user ID

  // Check if there was an error
  if (error != undefined) console.log(error.message);
}

export { createConversation, deleteConversation, deleteConversations };
