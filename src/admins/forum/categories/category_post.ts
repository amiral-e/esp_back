import config from "../../../config.ts";

/**
 * Creates a new category in the database.
 * 
 * @param {any} c The context object containing the request and response.
 * @returns {Promise<void>} A promise that resolves when the category has been created.
 */
async function post_category(c: any) {
	// Get the user object from the context
	const user = c.get("user");
	// Check if the user is an admin, if not return a 403 Forbidden response
	if (!user.admin) return c.json({ error: "Forbidden" }, 403);

	// Initialize a variable to store the JSON data from the request
	let json: any;
	try {
		// Attempt to parse the JSON data from the request
		json = await c.req.json();
		// Check if the JSON data contains the required 'name' and 'description' properties
		if (json?.name == undefined || json?.description == undefined)
			// If not, return a 400 Bad Request response
			return c.json({ error: "Invalid JSON" }, 400);
	} catch (error) {
		// If an error occurs while parsing the JSON, return a 400 Bad Request response
		return c.json({ error: "Invalid JSON" }, 400);
	}

	// Insert the JSON data into the 'categories' table in the database
	await config.supabaseClient.from("categories").insert(json).select("*");

	// Return a 200 OK response with a success message
	return c.json({ message: "Category created successfully" }, 200);
}

export default post_category;