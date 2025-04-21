import config from "../../../config.ts";

/**
 * Deletes a category from the database.
 * 
 * @param {any} c The context object containing the request and response.
 * @returns {Promise<void>} A promise that resolves when the category has been deleted.
 */
async function delete_category(c: any) {
	// Retrieve the user object from the context
	const user = c.get("user");
	// Check if the user is an admin, if not return a 403 Forbidden response
	if (!user.admin) return c.json({ error: "Forbidden" }, 403);

	// Get the category id from the request parameters
	const { id } = await c.req.param();

	// Query the database to check if the category exists
	const categories = await config.supabaseClient
		.from("categories")
		.select("*")
		.eq("id", id)
		.single();
	// If the category is not found, return a 404 Not Found response
	if (categories.data == undefined || categories.data.length == 0)
		return c.json({ error: "Category not found" }, 404);

	// Delete the category from the database
	await config.supabaseClient
		.from("categories")
		.delete()
		.eq("id", id)
		.select("*");

	// Return a 200 OK response with a success message
	return c.json({ message: "Category deleted successfully" }, 200);
}

export default delete_category;