import config from "../../config.ts";

/**
 * Deletes a conversation from the database.
 * 
 * @param {any} c - The context object containing the user and request parameters.
 * @returns {Promise<void>} A promise that resolves with a JSON response indicating the deletion result.
 */
async function delete_conversation(c: any) {
  // Retrieve the user object from the context
  const user = c.get("user");
  
  // Extract the conversation ID from the request parameters
  const { conv_id } = c.req.param();

  // Query the database to find the conversation
  const conversation = await config.supabaseClient
    .from("conversations")
    .select("*")
    .eq("user_id", user.uid)
    .eq("id", conv_id)
    .single();
  
  // Check if the conversation exists
  if (conversation.data == undefined || conversation.data.length == 0)
    // Return an error response if the conversation is not found
    return c.json({ error: "Conversation not found" }, 404);

  // Delete the conversation from the database
  await config.supabaseClient
    .from("conversations")
    .delete()
    .eq("id", conversation.data.id);

  // Return a success response
  return c.json({ message: `Conversation deleted successfully` }, 200);
}

export default delete_conversation;