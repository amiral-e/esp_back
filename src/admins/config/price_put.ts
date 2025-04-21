import config from "../../config.ts";

/**
 * Updates the value of a price in the database.
 * 
 * @param c - The context object containing the request and user information.
 * @returns A JSON response with a message indicating whether the update was successful.
 */
async function put_price(c: any) {
	const user = c.get("user");
	if (!user.admin) return c.json({ error: "Forbidden" }, 403);

	const { price_name } = c.req.param();

	let value = "";
	try {
		const json = await c.req.json();
		if (json?.value == undefined || typeof json?.value !== "number")
			throw new Error();
		value = json.value;
	} catch (error) {
		return c.json({ error: "Invalid JSON" }, 400);
	}

	const price = await config.supabaseClient
		.from("prices")
		.select("*")
		.eq("price", price_name)
		.single();

	if (price.data == undefined) return c.json({ error: "No price found" }, 404);

	await config.supabaseClient
		.from("prices")
		.update({ value: value })
		.eq("price", price_name);

	return c.json({ message: "Price updated successfully" }, 200);
}

export default put_price;
