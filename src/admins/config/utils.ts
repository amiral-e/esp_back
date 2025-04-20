import config from "../../config.ts";

async function createPrice(name: string) {
	try {
		// Create price
		const price = await config.supabaseClient
			.from("prices")
			.insert({
				price: name,
				value: 0.5,
				description: "original price of x / 1M tokens",
			})
			.select("price")
			.single();
		if (price.error != undefined) return false;
		return price.data.price;
	} catch (error: any) {
		console.error("Error creating price:", error.message);
		return error.message;
	}
}

async function deletePrice(price: string) {
	const { error: deleteError } = await config.supabaseClient
		.from("prices")
		.delete()
		.eq("price", price);

	if (deleteError) {
		throw deleteError;
	}
}

export { createPrice, deletePrice };
