import config from "../../config.ts";

/**
 * Creates a new price in the database.
 * 
 * @param name - The name of the price to create.
 * @returns The name of the created price, or an error message if creation fails.
 */
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

/**
 * Deletes a price from the database.
 * 
 * @param price - The name of the price to delete.
 * @throws An error if deletion fails.
 */
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
