import config from "../../../config";

async function post_announcement(c: any) {
	const user = c.get("user");
	if (!user.admin) return c.json({ error: "Forbidden" }, 403);

	let json: any;
	try {
		json = await c.req.json();
		if (json?.message == undefined)
			return c.json({ error: "Invalid JSON" }, 400);
	} catch (error) {
		return c.json({ error: "Invalid JSON" }, 400);
	}

	await config.supabaseClient
		.from("announcements")
		.insert(json)
		.select("*")
		.single();

	return c.json({ message: "Announcement created successfully" }, 200);
}

export default post_announcement;
