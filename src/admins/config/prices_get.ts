import config from "../../config.ts";

/**
 * Retrieves a list of prices from the database.
 * 
 * @param c - The context object containing the request and user information.
 * @returns A JSON response with a list of prices, or an error message if no prices are found.
 */
async function get_prices(c: any) {
	// Retrieve the user from the context object
	const user = c.get("user");

	// Check if the user is an admin, if not, return a forbidden error
	if (!user.admin) return c.json({ error: "Forbidden" }, 403);

	// Query the "prices" table to retrieve all prices
	const prices = await config.supabaseClient
		.from("prices")
		.select("price, description, value");

	// Check if any prices were found
	if (prices.data == undefined || prices.data.length == 0)
		return c.json({ error: "No price found" }, 404);

	// If prices were found, return a 200 response with the prices data
	return c.json({ prices: prices.data }, 200);
}

export default get_prices;

