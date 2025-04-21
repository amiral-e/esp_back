import config from "../../../config.ts";

/**
 * Deletes a publication by its ID if the user is authorized to do so.
 * 
 * @param c The context object containing the request and response information.
 * @returns A JSON response indicating whether the deletion was successful or an error message if the user is not authorized or the publication is not found.
 */
async function post_delete(c: any) {
	const user = c.get("user");
	if (!user) return c.json({ error: "Invalid user" }, 401);

	const postId = c.req.param("id");
	const { data: post, error: fetchError } = await config.supabaseClient
		.from("publications")
		.select("user_id")
		.eq("id", postId)
		.single();

	if (fetchError || !post) return c.json({ error: "Post not found" }, 404);
	if (post.user_id !== user.uid)
		return c.json({ error: "User not authorized to delete this post" }, 403);

	const { error: deleteError } = await config.supabaseClient
		.from("publications")
		.delete()
		.eq("id", postId);

	if (deleteError) return c.json({ error: deleteError.message }, 500);

	return c.json({ message: "Post deleted successfully" }, 200);
}

export default post_delete;
