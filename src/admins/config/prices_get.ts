import config from "../../config.ts";

async function get_prices(c: any) {
	const user = c.get("user");
	if (!user.admin) return c.json({ error: "Forbidden" }, 403);

	const prices = await config.supabaseClient
		.from("prices")
		.select("price, description, value");
	if (prices.data == undefined || prices.data.length == 0)
		return c.json({ error: "No price found" }, 404);

	return c.json({ prices: prices.data }, 200);
}

export default get_prices;
