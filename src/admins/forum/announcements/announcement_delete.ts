import config from "../../../config.ts";

/**
 * Deletes an announcement by ID.
 * 
 * @param c The request context.
 * @returns A JSON response with a success message or an error.
 */
async function delete_announcement(c: any) {
	// Get the user from the request context and check if they are an admin
	const user = c.get("user");
	if (!user.admin) return c.json({ error: "Forbidden" }, 403);

	// Get the announcement ID from the request parameters
	const { id } = await c.req.param();

	// Retrieve the announcement from the database by ID
	const announcement = await config.supabaseClient
		.from("announcements")
		.select("*")
		.eq("id", id)
		.single();
	// Check if the announcement exists in the database
	if (announcement.data == undefined || announcement.data.length == 0)
		return c.json({ error: "Announcement not found" }, 404);

	// Delete the announcement from the database by ID
	await config.supabaseClient
		.from("announcements")
		.delete()
		.eq("id", id)
		.select("*");

	// Return a success response after deleting the announcement
	return c.json({ message: "Announcement deleted successfully" }, 200);
}

export default delete_announcement;