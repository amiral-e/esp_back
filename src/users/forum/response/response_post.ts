import config from "../../../config.ts";

/**
 * Creates a new response in the database.
 * 
 * @param {any} c - The context object containing the user information and request data.
 * @returns {Promise<any>} A JSON response with a success message and the ID of the newly created response.
 */
async function post_response(c: any) {
	// Get the user information from the context object
	const user = c.get("user");
	let body: any;

	try {
		// Attempt to parse the request body as JSON
		body = await c.req.json();
		// Check if the message field is present in the request body
		if (!body?.message) {
			// Return a 400 error if the message field is missing
			return c.json({ error: "Message is required" }, 400);
		}
	} catch (error) {
		// Return a 400 error if the request body is not valid JSON
		return c.json({ error: "Invalid JSON body" }, 400);
	}

	// Insert a new response into the database using the Supabase client
	const insertion = await config.supabaseClient
		.from("responses")
		.insert({ message: body.message, user_id: user.uid })
		.select()
		.single();

	// Return a JSON response with a success message and the ID of the newly created response
	return c.json(
		{ message: "Response added successfully", id: insertion.data.id },
		200,
	);
}

export default post_response;