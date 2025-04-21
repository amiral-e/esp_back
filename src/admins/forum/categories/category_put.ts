import config from "../../../config.ts";

/**
 * Updates an existing category in the database.
 * 
 * @param {any} c The context object containing the request and response.
 * @returns {Promise<void>} A promise that resolves when the category has been updated.
 */
async function put_category(c: any) {
	// Check if the user is an admin, if not return a 403 Forbidden response
	const user = c.get("user");
	if (!user.admin) return c.json({ error: "Forbidden" }, 403);

	// Get the id parameter from the request
	const { id } = await c.req.param();

	let json: any;
	try {
		// Attempt to parse the request body as JSON
		json = await c.req.json();
		// Check if the JSON is valid (i.e., it has a name or description property)
		if (json?.name == undefined && json?.description == undefined)
			return c.json({ error: "Invalid JSON" }, 400);
	} catch (error) {
		// If parsing the JSON fails, return a 400 Bad Request response
		return c.json({ error: "Invalid JSON" }, 400);
	}

	// Check if the category exists in the database
	const categorie = await config.supabaseClient
		.from("categories")
		.select("name")
		.eq("id", id)
		.single();
	// If the category is not found, return a 404 Not Found response
	if (categorie.data == undefined || categorie.data.length == 0)
		return c.json({ error: "Category not found" }, 404);

	// Update the category in the database
	await config.supabaseClient.from("categories").update(json).eq("id", id);

	// Return a 200 OK response with a success message
	return c.json({ message: "Category updated successfully" }, 200);
}

export default put_category;