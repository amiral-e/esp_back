import config from "../../../config.ts";

/**
 * Creates a new publication in the database.
 * 
 * @param {any} c - The context object containing the user and request body.
 * @returns {Promise<any>} A JSON response indicating whether the creation was successful, along with the created post.
 */
async function post_create(c: any) {
	const user = c.get("user");
	if (!user) return c.json({ error: "Invalid user" }, 401);

	const { title, content } = await c.req.json();
	if (!title || !content)
		return c.json({ error: "Missing title or content" }, 400);

	const { data: postData, error: postError } = await config.supabaseClient
		.from("publications")
		.insert([{ title, content, user_id: user.id }])
		.select("*")
		.single();
	if (postError) return c.json({ error: postError.message }, 500);

	return c.json({ message: "Post created successfully", post: postData }, 201);
}

export default post_create;
