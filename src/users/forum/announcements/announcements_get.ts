import config from "../../../config";

/**
 * Retrieves a list of announcements from the database.
 * 
 * @param c The context object containing the request and response information.
 * @returns A JSON response containing the list of announcements or an error message if no announcements are found.
 */
async function get_announcements(c: any) {
	const announcements = await config.supabaseClient
		.from("announcements")
		.select("*");

	if (announcements.data == undefined || announcements.data.length == 0)
		return c.json({ error: "No announcement found" }, 404);

	return c.json({ announcements: announcements.data }, 200);
}

export default get_announcements;
