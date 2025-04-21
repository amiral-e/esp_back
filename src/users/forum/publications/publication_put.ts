import config from "../../../config.ts";

/**
 * Updates an existing publication post.
 * 
 * @param {any} c - The context object containing the user and request data.
 * @returns {Promise<any>} A JSON response with the updated post data or an error message.
 */
async function post_update(c: any) {
  // Retrieve the user from the context object
  const user = c.get("user");
  // If the user is not found, return an unauthorized response
  if (!user) return c.json({ error: "Invalid user" }, 401);

  // Get the post ID from the request parameters
  const { id } = c.req.param();
  // Get the updated title and content from the request body
  const { title, content } = await c.req.json();
  // Check if the title or content is missing, return a bad request response if so
  if (!title || !content)
    return c.json({ error: "Missing title or content" }, 400);

  // Attempt to fetch the existing post from the database
  const { data: existingPost, error: fetchError } = await config.supabaseClient
    .from("publications")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  // If the post is not found or an error occurred, return a not found response
  if (fetchError || !existingPost)
    return c.json({ error: "Post not found" }, 404);

  // Update the post with the new title, content, and updated_at timestamp
  const { data: updatedPost, error: updateError } = await config.supabaseClient
    .from("publications")
    .update({ title, content, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .single();

  // If an error occurred during the update, return an internal server error response
  if (updateError) return c.json({ error: updateError.message }, 500);

  // Return a successful response with the updated post data
  return c.json(
    { message: "Post updated successfully", post: updatedPost },
    200,
  );
}

export default post_update;