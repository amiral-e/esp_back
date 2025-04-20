import config from "../../../config.ts";

async function put_announcement(c: any) {
	const user = c.get("user");
	if (!user.admin) return c.json({ error: "Forbidden" }, 403);

	const { id } = await c.req.param();

	let json: any;
	try {
		json = await c.req.json();
		if (json?.message == undefined)
			return c.json({ error: "Invalid JSON" }, 400);
	} catch (error) {
		return c.json({ error: "Invalid JSON" }, 400);
	}

	const announcement = await config.supabaseClient
		.from("announcements")
		.select("*")
		.eq("id", id)
		.single();
	if (announcement.data == undefined || announcement.data.length == 0)
		return c.json({ error: "Announcement not found" }, 404);

	await config.supabaseClient
		.from("announcements")
		.update(json)
		.eq("id", id)
		.select("*")
		.single();

	return c.json({ message: "Announcement updated successfully" }, 200);
}

export default put_announcement;
