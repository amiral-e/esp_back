import config from "../../../config";

/**
 * Creates a new announcement.
 * 
 * @param c The request context.
 * @returns A JSON response with a success message or an error.
 */
async function post_announcement(c: any) {
	// Retrieve the user from the request context
	const user = c.get("user");
	// Check if the user has admin privileges
	if (!user.admin) return c.json({ error: "Forbidden" }, 403);

	let json: any;
	try {
		// Attempt to parse the request body as JSON
		json = await c.req.json();
		// Validate that the JSON contains a 'message' property
		if (json?.message == undefined)
			return c.json({ error: "Invalid JSON" }, 400);
	} catch (error) {
		// If JSON parsing fails, return an error response
		return c.json({ error: "Invalid JSON" }, 400);
	}

	// Insert the JSON data into the 'announcements' table in the database
	await config.supabaseClient
		.from("announcements")
		.insert(json)
		.select("*")
		.single();

	// Return a success response with a message
	return c.json({ message: "Announcement created successfully" }, 200);
}

export default post_announcement;