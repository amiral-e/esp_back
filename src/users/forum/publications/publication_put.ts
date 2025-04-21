import config from "../../../config.ts";

/**
 * Updates an existing publication post.
 * 
 * @param {any} c - The context object containing the user and request data.
 * @returns {Promise<any>} A JSON response with the updated post data or an error message.
 */
async function post_update(c: any) {
	const user = c.get("user");
	if (!user) return c.json({ error: "Invalid user" }, 401);

	const { id } = c.req.param();
	const { title, content } = await c.req.json();
	if (!title || !content)
		return c.json({ error: "Missing title or content" }, 400);

	const { data: existingPost, error: fetchError } = await config.supabaseClient
		.from("publications")
		.select("*")
		.eq("id", id)
		.eq("user_id", user.id)
		.single();

	if (fetchError || !existingPost)
		return c.json({ error: "Post not found" }, 404);

	const { data: updatedPost, error: updateError } = await config.supabaseClient
		.from("publications")
		.update({ title, content, updated_at: new Date().toISOString() })
		.eq("id", id)
		.eq("user_id", user.id)
		.select("*")
		.single();

	if (updateError) return c.json({ error: updateError.message }, 500);

	return c.json(
		{ message: "Post updated successfully", post: updatedPost },
		200,
	);
}

export default post_update;
