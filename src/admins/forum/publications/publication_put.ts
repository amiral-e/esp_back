import config from "../../../config.ts";

async function post_update(c: any) {
	try {
		const user = c.get("user");
		if (!user) return c.json({ error: "Invalid user" }, 401);

		const { id } = await c.req.param();

		let json: any;
		try {
			json = await c.req.json();
			if (!json || !json.title || !json.content) {
				return c.json({ error: "Invalid JSON" }, 400);
			}
		} catch (error) {
			return c.json({ error: "Invalid JSON" }, 400);
		}

		// Vérifier si le post existe
		const post = await config.supabaseClient
			.from("publications")
			.select("*")
			.eq("id", id)
			.single();

		if (post.error || !post.data) {
			return c.json({ error: "Post not found" }, 404);
		}

		// Vérifier si l'utilisateur est le propriétaire du post
		if (post.data.user_id !== user.uid) {
			return c.json(
				{ error: "Vous n'êtes pas autorisé à modifier ce post" },
				403,
			);
		}

		// Mettre à jour le post
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
