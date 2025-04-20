import config from "../../../config.ts";

async function post_delete(c: any) {
	const user = c.get("user");
	if (!user) return c.json({ error: "Invalid user" }, 401);

	const { id } = c.req.param();

	const { data: existingPost, error: fetchError } = await config.supabaseClient
		.from("publications")
		.select("id", "user_id")
		.eq("id", id)
		.eq("user_id", user.id)
		.single();

	if (fetchError || !existingPost)
		return c.json({ error: "Post not found" }, 404);

	const { error: deleteError } = await config.supabaseClient
		.from("publications")
		.delete()
		.eq("id", id)
		.eq("user_id", user.id);

	if (deleteError) return c.json({ error: deleteError.message }, 500);

	return c.json({ message: "Post deleted successfully" }, 200);
}

export default post_delete;
