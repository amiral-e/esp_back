import config from "../../../config";

/**
 * Retrieves a list of announcements from the database.
 * 
 * @param c The context object containing the request and response information.
 * @returns A JSON response containing the list of announcements or an error message if no announcements are found.
 */
async function get_announcements(c: any) {
	// Query the supabase database to retrieve all announcements
	const announcements = await config.supabaseClient
		.from("announcements")
		.select("*");

	// Check if the query returned any data or if the data array is empty
	if (announcements.data == undefined || announcements.data.length == 0)
		// If no announcements are found, return a 404 error with a JSON response
		return c.json({ error: "No announcement found" }, 404);

	// If announcements are found, return a 200 OK response with the list of announcements
	return c.json({ announcements: announcements.data }, 200);
}

export default get_announcements;