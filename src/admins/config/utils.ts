import config from "../../config.ts";

/**
 * Creates a new price in the database.
 * 
 * @param name - The name of the price to create.
 * @returns The name of the created price, or an error message if creation fails.
 */
async function createPrice(name: string) {
	try {
		// Attempt to insert a new price into the 'prices' table
		const price = await config.supabaseClient
			.from("prices")
			.insert({
				price: name,
				value: 0.5,
				description: "original price of x / 1M tokens",
			})
			.select("price")
			.single();
		// Check if an error occurred during the insertion
		if (price.error != undefined) return false;
		return price.data.price;
	} catch (error: any) {
		// Log any error that occurs during the creation process
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
	// Attempt to delete the price from the 'prices' table
	const { error: deleteError } = await config.supabaseClient
		.from("prices")
		.delete()
		.eq("price", price);

	// Check if an error occurred during deletion
	if (deleteError) {
		throw deleteError;
	}
}

export { createPrice, deletePrice };
