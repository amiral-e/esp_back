import config from "../../../config.ts";

/**
 * Creates a new publication post.
 * 
 * @param {any} c - The context object containing the user and request data.
 * @returns {Promise<any>} A JSON response with the created post data or an error message.
 */
async function post_create(c: any) {
	// Get the user from the context object
	const user = c.get("user");

	// Check if the user is authenticated
	if (!user) return c.json({ error: "Invalid user" }, 401);

	// Get the request body
	const body = await c.req.json();
	const { title, content } = body;

	// Validate the request data
	if (!title || !content)
		return c.json({ error: "Missing title or content" }, 400);

	// Insert the new publication into the database
	const { data: postData, error: postError } = await config.supabaseClient
		.from("publications")
		.insert([{ title, content, user_id: user.uid }])
		.select("*")
		.single();

	// Handle any database errors
	if (postError) return c.json({ error: postError.message }, 500);

	// Return the created post data
	return c.json({ message: "Post created successfully", post: postData }, 201);
}

export default post_create;