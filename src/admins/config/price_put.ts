import config from "../../config.ts";

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
