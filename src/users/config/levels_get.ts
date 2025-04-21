import config from "../../config.ts";

/**
 * Retrieves a list of levels from the Supabase database.
 * 
 * @param {any} c - The context object.
 * @returns {Promise<void>} A promise that resolves with a JSON response containing the levels or an error message.
 */
async function get_levels(c: any) {
	const levels = await config.supabaseClient
		.from("prompts")
		.select("type")
		.eq("knowledge", true);
	if (levels.data == undefined || levels.data.length == 0)
		return c.json({ error: "No level found" }, 404);

	return c.json({ levels: levels.data.map((l: any) => l.type) }, 200);
}

export default get_levels;
