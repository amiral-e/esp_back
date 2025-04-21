import config from "../../../config.ts";

/**
 * Deletes a publication from the database.
 * 
 * @param {any} c - The context object containing the user and request parameters.
 * @returns {Promise<any>} A JSON response indicating whether the deletion was successful.
 */
async function post_delete(c: any) {
  // Extract the user from the context object
  const user = c.get("user");
  // If no user is found, return an error response
  if (!user) return c.json({ error: "Invalid user" }, 401);

  // Get the id parameter from the request
  const { id } = c.req.param();

  // Attempt to fetch the publication from the database
  const { data: existingPost, error: fetchError } = await config.supabaseClient
    .from("publications")
    .select("id", "user_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  // If an error occurs or the publication is not found, return an error response
  if (fetchError || !existingPost)
    return c.json({ error: "Post not found" }, 404);

  // Attempt to delete the publication from the database
  const { error: deleteError } = await config.supabaseClient
    .from("publications")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  // If an error occurs during deletion, return an error response
  if (deleteError) return c.json({ error: deleteError.message }, 500);

  // If deletion is successful, return a success response
  return c.json({ message: "Post deleted successfully" }, 200);
}

export default post_delete;