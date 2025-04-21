import config from "../../config.ts";

/**
 * Updates the value of a price in the database.
 * 
 * @param c - The context object containing the request and user information.
 * @returns A JSON response with a message indicating whether the update was successful.
 */
async function put_price(c: any) {
    // Get the user from the context object
	const user = c.get("user");
	if (!user.admin) return c.json({ error: "Forbidden" }, 403);

    // Get the price name from the request parameters
	const { price_name } = c.req.param();

    // Initialize the value variable
	let value = "";

	try {
        // Try to parse the JSON from the request
		const json = await c.req.json();

        // Check if the JSON value is valid (not undefined and a number)
		if (json?.value == undefined || typeof json?.value !== "number")
			throw new Error();

        // Set the value variable
		value = json.value;
	} catch (error) {
        // Return an error response if the JSON is invalid
		return c.json({ error: "Invalid JSON" }, 400);
	}

    // Query the database to get the price
	const price = await config.supabaseClient
		.from("prices")
		.select("*")
		.eq("price", price_name)
		.single();

    // Check if the price was found
	if (price.data == undefined) return c.json({ error: "No price found" }, 404);

    // Update the price in the database
	await config.supabaseClient
		.from("prices")
		.update({ value: value })
		.eq("price", price_name);

    // Return a success response
	return c.json({ message: "Price updated successfully" }, 200);
}

export default put_price;
