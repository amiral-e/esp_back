import config from "../../config.ts";

/**
 * Retrieves the profile of a user.
 * 
 * @param c The context object containing the user information.
 * @returns A promise resolving with the user's profile data in JSON format.
 */
async function get_profile(c: any) {
	// Extract the user object from the context
	const user = c.get("user");

	// Query the Supabase database to retrieve the user's profile
	const profile = await config.supabaseClient
		.from("profiles")
		.select("*")
		.eq("id", user.uid)
		.single();
	
	// Check if the profile is not found
	if (profile.data == undefined)
		// Return a 404 error with a JSON response indicating no profile found
		return c.json({ error: "No profile found" }, 404);

	// Return the user's profile data as a JSON response with a 200 status code
	return c.json({ profile: profile.data }, 200);
}

export default get_profile;