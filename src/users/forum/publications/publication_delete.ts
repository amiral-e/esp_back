import config from "../../../config.ts";

/**
 * Deletes a publication by its ID if the user is authorized to do so.
 * 
 * @param c The context object containing the request and response information.
 * @returns A JSON response indicating whether the deletion was successful or an error message if the user is not authorized or the publication is not found.
 */
async function post_delete(c: any) {
	// Retrieve the user from the context object
	const user = c.get("user");
	// If no user is found, return an error response
	if (!user) return c.json({ error: "Invalid user" }, 401);

	// Get the post ID from the request parameters
	const postId = c.req.param("id");
	// Fetch the post from the database to verify its existence and user ownership
	const { data: post, error: fetchError } = await config.supabaseClient
		.from("publications")
		.select("user_id")
		.eq("id", postId)
		.single();

	// If an error occurs during fetch or the post is not found, return a 404 error response
	if (fetchError || !post) return c.json({ error: "Post not found" }, 404);
	// If the user is not the owner of the post, return a 403 error response
	if (post.user_id !== user.uid)
		return c.json({ error: "User not authorized to delete this post" }, 403);

	// Attempt to delete the post from the database
	const { error: deleteError } = await config.supabaseClient
		.from("publications")
		.delete()
		.eq("id", postId);

	// If an error occurs during deletion, return a 500 error response
	if (deleteError) return c.json({ error: deleteError.message }, 500);

	// If the post is deleted successfully, return a 200 success response
	return c.json({ message: "Post deleted successfully" }, 200);
}

export default post_delete;