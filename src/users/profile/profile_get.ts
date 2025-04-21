import config from "../../config.ts";

/**
 * Retrieves the profile of a user.
 * 
 * @param c The context object containing the user information.
 * @returns A promise resolving with the user's profile data in JSON format.
 */
async function get_profile(c: any) {
	const user = c.get("user");

	const profile = await config.supabaseClient
		.from("profiles")
		.select("*")
		.eq("id", user.uid)
		.single();
	if (profile.data == undefined)
		return c.json({ error: "No profile found" }, 404);

	return c.json({ profile: profile.data }, 200);
}

export default get_profile;
