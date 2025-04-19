import config from "../../config.ts";

async function put_level(c: any) {
	const user = c.get("user");
	if (!user.admin) return c.json({ error: "Forbidden" }, 403);

	const { user_id } = await c.req.param();

	let json: any;
	try {
		json = await c.req.json();
		if (json?.level == undefined)
			return c.json({ error: "Invalid JSON" }, 400);
	} catch (error) {
		return c.json({ error: "Invalid JSON" }, 400);
	}

	const levels = await config.supabaseClient
		.from("prompts")
		.select("id, type")
		.eq("knowledge", true);
	if (levels.data == undefined || levels.data.length == 0)
		return c.json({ error: "No level found" }, 404);

	if (!levels.data.some((level: any) => level.type == json.level))
		return c.json({ error: "Invalid level" }, 400);

	const profile = await config.supabaseClient
		.from("profiles")
		.select("*")
		.eq("id", user_id)
		.single();
	if (profile.data == undefined)
		return c.json({ error: "No profile found" }, 404);

	await config.supabaseClient
		.from("profiles")
		.update({ level: json.level })
		.eq("id", user_id)
		.single();

	return c.json({ message: "Level updated successfully" }, 200);
}

export default put_level;
