import config from "../../config.ts";

/**
 * Updates a conversation for the current user.
 * 
 * @param {any} c - The context object containing the user and request information.
 * @returns {Promise<void>} - A promise that resolves with the updated conversation response.
 */
async function put_conversation(c: any) {
  // Retrieve the current user from the context object
  const user = c.get("user");
  let json: any;

  try {
    // Attempt to parse the request body as JSON
    json = await c.req.json();
    // Check if the JSON body contains a 'name' property, return an error if it's missing
    if (json?.name == undefined) return c.json({ error: "Invalid JSON" }, 400);
  } catch (error) {
    // If JSON parsing fails, return an error
    return c.json({ error: "Invalid JSON" }, 400);
  }
  // Extract the conversation ID from the request parameters
  const { conv_id } = c.req.param();

  // Query the 'conversations' table to find the conversation with the specified ID and user ID
  const conversation = await config.supabaseClient
    .from("conversations")
    .select("*")
    .eq("user_id", user.uid)
    .eq("id", conv_id)
    .single();
  // If the conversation is not found, return a 404 error
  if (conversation.data == undefined || conversation.data.length == 0)
    return c.json({ error: "Conversation not found" }, 404);

  // Update the conversation with the new name
  await config.supabaseClient
    .from("conversations")
    .update({ name: json.name })
    .eq("id", conversation.data.id);

  // Return a success message with a 200 status code
  return c.json({ message: `Conversation updated successfully` }, 200);
}

export default put_conversation;