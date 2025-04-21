import config from "../../config.ts";

/**
 * Handles a GET request to retrieve a user's profile.
 * 
 * @param c The request context.
 * @returns The response to the request, containing the user's profile.
 */
async function get_profile(c: any) {
	// First, retrieve the user making the request
	const user = c.get("user");
	// Check if the user has admin privileges
	if (!user.admin) return c.json({ error: "Forbidden" }, 403);

	// Extract the user ID from the request parameters
	const { user_id } = await c.req.param();

	// Query the Supabase client for the user's profile
	const profile = await config.supabaseClient
	.from("profiles")
	.select("*")
	.eq("id", user_id)
	.single();
	// If no profile is found, return a 404 error
	if (profile.data == undefined)
	return c.json({ error: "No profile found" }, 404);

	// Return the user's profile with a 200 status code
	return c.json({ profile: profile.data }, 200);
}

export default get_profile;