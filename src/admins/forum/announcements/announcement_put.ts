import config from "../../../config.ts";

/**
 * Updates an existing announcement by ID.
 * 
 * @param c The request context.
 * @returns A JSON response with a success message or an error.
 */
async function put_announcement(c: any) {
	// Get the user from the request context
	const user = c.get("user");
	// Check if the user is an admin, return 403 Forbidden if not
	if (!user.admin) return c.json({ error: "Forbidden" }, 403);

	// Get the announcement ID from the request parameters
	const { id } = await c.req.param();

	// Initialize a variable to store the request JSON data
	let json: any;
	try {
		// Attempt to parse the request JSON data
		json = await c.req.json();
		// Check if the JSON data contains a 'message' property, return 400 Bad Request if not
		if (json?.message == undefined)
			return c.json({ error: "Invalid JSON" }, 400);
	} catch (error) {
		// If JSON parsing fails, return 400 Bad Request
		return c.json({ error: "Invalid JSON" }, 400);
	}

	// Query the Supabase database to retrieve the announcement by ID
	const announcement = await config.supabaseClient
		.from("announcements")
		.select("*")
		.eq("id", id)
		.single();
	// Check if the announcement exists, return 404 Not Found if not
	if (announcement.data == undefined || announcement.data.length == 0)
		return c.json({ error: "Announcement not found" }, 404);

	// Update the announcement in the Supabase database
	await config.supabaseClient
		.from("announcements")
		.update(json)
		.eq("id", id)
		.select("*")
		.single();

	// Return a successful response with a 200 OK status code
	return c.json({ message: "Announcement updated successfully" }, 200);
}

export default put_announcement;