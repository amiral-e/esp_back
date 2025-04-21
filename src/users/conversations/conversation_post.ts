import config from "../../config.ts";

/**
 * Creates a new conversation in the database.
 * 
 * @param {any} c - The context object containing the user and request body.
 * @returns {Promise<void>} A promise that resolves with a JSON response containing the created conversation ID or an error message.
 */
async function post_conversation(c: any) {
	// Retrieve the user object from the context
	const user = c.get("user");

	let json: any;
	try {
		// Attempt to parse the request body as JSON
		json = await c.req.json();
		// Check if the JSON object contains the required 'name' property
		if (json?.name == undefined) return c.json({ error: "Invalid JSON" }, 400);
	} catch (error) {
		// If parsing fails, return an error response
		return c.json({ error: "Invalid JSON" }, 400);
	}

	// Insert a new conversation into the database
	const insertion = await config.supabaseClient
		.from("conversations")
		.insert({ history: [], name: json.name, user_id: user.uid })
		.select("*")
		.single();
	// Return a successful response with the created conversation ID
	return c.json(
		{ message: `Conversation created successfully`, id: insertion.data.id },
		200,
	);
}

export default post_conversation;