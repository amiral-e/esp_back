import config from "../../../config.ts";

/**
 * Updates an existing publication in the database.
 * 
 * @param {any} c - The context object containing the user, request parameters, and request body.
 * @returns {Promise<any>} A JSON response indicating whether the update was successful, along with the updated post.
 */
async function post_update(c: any) {
	try {
		// Retrieve the user from the context object
		const user = c.get("user");
		if (!user) return c.json({ error: "Invalid user" }, 401);

		// Get the post ID from the request parameters
		const { id } = await c.req.param();

		let json: any;
		try {
			// Parse the JSON request body
			json = await c.req.json();
			// Validate the JSON body to ensure it contains the required fields
			if (!json?.title || !json?.content) {
				return c.json({ error: "Invalid JSON" }, 400);
			}
		} catch (error) {
			// If the JSON parsing fails, return an error response
			return c.json({ error: "Invalid JSON" }, 400);
		}

		// Query the database to retrieve the post with the specified ID
		const post = await config.supabaseClient
			.from("publications")
			.select("*")
			.eq("id", id)
			.single();

		// If the post is not found, return a 404 error response
		if (post.error || !post.data) {
			return c.json({ error: "Post not found" }, 404);
		}

		// Check if the user has permission to update the post
		if (post.data.user_id !== user.uid) {
			return c.json(
				{ error: "Vous n'êtes pas autorisé à modifier ce post" },
				403,
			);
		}

		// Update the post in the database with the new title, content, and updated_at timestamp
		const update = await config.supabaseClient
			.from("publications")
			.update({
				title: json.title,
				content: json.content,
				updated_at: new Date().toISOString(),
			})
			.eq("id", id)
			.eq("user_id", user.uid)
			.select("*")
			.single();

		// If the update fails, return a 500 error response with the error message
		if (update.error) {
			return c.json({ error: update.error.message }, 500);
		}

		// If the update is successful, return a 200 response with the updated post
		return c.json(
			{ message: "Post updated successfully", post: update.data },
			200,
		);
	} catch (error) {
		// Log any unexpected errors and return a 500 error response
		console.error("Unexpected error:", error);
		return c.json({ error: "Une erreur inattendue s'est produite" }, 500);
	}
}

export default post_update;