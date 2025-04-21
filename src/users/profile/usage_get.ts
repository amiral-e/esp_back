import config from "../../config.ts";

/**
 * Retrieves the usage data of a user.
 * 
 * @param c The context object containing the user information.
 * @returns A promise resolving with the user's usage data in JSON format.
 */
async function get_usage(c: any) {
	// Retrieve the user object from the context
	const user = c.get("user");

	// Query the Supabase database for the user's usage data
	const usage = await config.supabaseClient
		.from("usage")
		.select("month, used_credits, total_messages, total_docs, total_reports")
		.eq("user_id", user.uid);
	
	// Check if the query returned any data
	if (usage.data == undefined) 
		// If no data is found, return a 404 error with a message
		return c.json({ error: "No usage found" }, 404);

	// If data is found, return it in JSON format with a 200 status code
	return c.json({ usage: usage.data }, 200);
}

export default get_usage;