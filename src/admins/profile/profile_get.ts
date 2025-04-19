import config from "../../config.ts";

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
