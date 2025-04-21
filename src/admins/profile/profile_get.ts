import config from "../../config.ts";

/**
 * Handles a GET request to retrieve a user's profile.
 * 
 * @param c The request context.
 * @returns The response to the request, containing the user's profile.
 */
async function get_profile(c: any) {
	const user = c.get("user");
	if (!user.admin) return c.json({ error: "Forbidden" }, 403);

	const { user_id } = await c.req.param();

	const profile = await config.supabaseClient
		.from("profiles")
		.select("*")
		.eq("id", user_id)
		.single();
	if (profile.data == undefined)
		return c.json({ error: "No profile found" }, 404);

	return c.json({ profile: profile.data }, 200);
}

export default get_profile;
