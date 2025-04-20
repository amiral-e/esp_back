import config from "../../../config.ts";

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
