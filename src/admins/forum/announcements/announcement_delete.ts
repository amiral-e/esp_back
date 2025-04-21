import config from "../../../config.ts";

/**
 * Deletes an announcement by ID.
 * 
 * @param c The request context.
 * @returns A JSON response with a success message or an error.
 */
async function delete_announcement(c: any) {
	const user = c.get("user");
	if (!user.admin) return c.json({ error: "Forbidden" }, 403);

	const { id } = await c.req.param();

	const announcement = await config.supabaseClient
		.from("announcements")
		.select("*")
		.eq("id", id)
		.single();
	if (announcement.data == undefined || announcement.data.length == 0)
		return c.json({ error: "Announcement not found" }, 404);

	await config.supabaseClient
		.from("announcements")
		.delete()
		.eq("id", id)
		.select("*");

	return c.json({ message: "Announcement deleted successfully" }, 200);
}

export default delete_announcement;
