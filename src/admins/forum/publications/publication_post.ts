import config from "../../../config.ts";

/**
 * Creates a new publication in the database.
 * 
 * @param {any} c - The context object containing the user and request body.
 * @returns {Promise<any>} A JSON response indicating whether the creation was successful, along with the created post.
 */
async function post_create(c: any) {
	// Get the user from the context object
	const user = c.get("user");
	// Check if the user is valid, return an error response if not
	if (!user) return c.json({ error: "Invalid user" }, 401);

	// Extract the title and content from the request body
	const { title, content } = await c.req.json();
	// Validate the title and content, return an error response if either is missing
	if (!title || !content)
		return c.json({ error: "Missing title or content" }, 400);

	// Insert the new publication into the database
	const { data: postData, error: postError } = await config.supabaseClient
		.from("publications")
		.insert([{ title, content, user_id: user.id }])
		.select("*")
		.single();
	// Check if the database operation was successful, return an error response if not
	if (postError) return c.json({ error: postError.message }, 500);

	// Return a success response with the created post
	return c.json({ message: "Post created successfully", post: postData }, 201);
}

export default post_create;