import config from "../../../config.ts";

/**
 * Updates an existing publication in the database.
 * 
 * @param {any} c - The context object containing the user, request parameters, and request body.
 * @returns {Promise<any>} A JSON response indicating whether the update was successful, along with the updated post.
 */
async function post_update(c: any) {
	try {
		const user = c.get("user");
		if (!user) return c.json({ error: "Invalid user" }, 401);

		const { id } = await c.req.param();

		let json: any;
		try {
			json = await c.req.json();
			if (!json?.title || !json?.content) {
				return c.json({ error: "Invalid JSON" }, 400);
			}
		} catch (error) {
			return c.json({ error: "Invalid JSON" }, 400);
		}

		const post = await config.supabaseClient
			.from("publications")
			.select("*")
			.eq("id", id)
			.single();

		if (post.error || !post.data) {
			return c.json({ error: "Post not found" }, 404);
		}

		if (post.data.user_id !== user.uid) {
			return c.json(
				{ error: "Vous n'êtes pas autorisé à modifier ce post" },
				403,
			);
		}

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

		if (update.error) {
			return c.json({ error: update.error.message }, 500);
		}

		return c.json(
			{ message: "Post updated successfully", post: update.data },
			200,
		);
	} catch (error) {
		console.error("Unexpected error:", error);
		return c.json({ error: "Une erreur inattendue s'est produite" }, 500);
	}
}

export default post_update;
