import config from "../../../config.ts";

/**
 * Retrieves a list of categories from the database.
 * 
 * @param c The context object containing the request and response information.
 * @returns A JSON response containing the list of categories or an error message if no categories are found.
 */
async function get_categories(c: any) {
	// Query the database to retrieve all categories
	const categories = await config.supabaseClient.from("categories").select("*");

	// Check if the query returned any categories
	if (categories.data == undefined || categories.data.length == 0)
		// If no categories are found, return a JSON error response with a 404 status code
		return c.json({ error: "No category found" }, 404);

	// If categories are found, return a JSON response with the list of categories and a 200 status code
	return c.json({ categories: categories.data }, 200);
}

export default get_categories;