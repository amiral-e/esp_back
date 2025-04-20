import config from "../../../config";

async function get_announcements(c: any) {
	const announcements = await config.supabaseClient
		.from("announcements")
		.select("*");

	if (announcements.data == undefined || announcements.data.length == 0)
		return c.json({ error: "No announcement found" }, 404);

	return c.json({ announcements: announcements.data }, 200);
}

export default get_announcements;
