import config from "../../config.ts";

/**
 * Retrieves all conversations for the current user.
 * 
 * @param {any} c - The context object containing the user and request information.
 * @returns {Promise<void>} - A promise that resolves with the conversations response.
 */
async function get_conversations(c: any) {
  // Retrieve the user object from the context
  const user = c.get("user");

  // Query the Supabase database for conversations belonging to the current user
  const conversations = await config.supabaseClient
    .from("conversations")
    .select("*")
    .eq("user_id", user.uid);
  
  // Check if the query returned any conversations
  if (conversations.data == undefined || conversations.data.length == 0)
    // If no conversations are found, return a 404 error with a message
    return c.json({ error: "No conversations found" }, 404);

  // If conversations are found, return them in the response with a 200 status code
  return c.json({ conversations: conversations.data }, 200);
}

export default get_conversations;