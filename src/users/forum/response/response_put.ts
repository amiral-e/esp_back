import config from "../../../config.ts";

/**
 * Updates an existing response in the database.
 * 
 * @param {any} c - The context object containing the user information and request data.
 * @returns {Promise<any>} A JSON response with a success message.
 */
async function put_response(c: any) {
	// Extract the user object from the context
	const user = c.get("user");
	// Get the response ID from the request parameters
	const id = c.req.param("id");
	let body: any;

	try {
		// Attempt to parse the request body as JSON
		body = await c.req.json();
		// Validate the JSON body to ensure it contains a non-empty message
		if (!body?.message?.trim()) {
			// Return an error response if the JSON body is invalid
			return c.json({ error: "Invalid JSON body" }, 400);
		}
	} catch (error) {
		// Return an error response if the JSON body is invalid
		return c.json({ error: "Invalid JSON body" }, 400);
	}

	// Retrieve the existing response from the database
	const response = await config.supabaseClient
		.from("responses")
		.select("*")
		.eq("id", id)
		.single();

	// Check if the response was not found in the database
	if (response.data == undefined || response.data.length == 0)
		// Return a 404 error response if the response was not found
		return c.json({ error: "Response not found" }, 404);

	// Check if the user is authorized to update the response
	if (user.uid != response.data.user_id)
		// Return a 403 error response if the user is not authorized
		return c.json({ error: "Forbidden" }, 403);

	// Update the response in the database with the new message
	await config.supabaseClient
		.from("responses")
		.update({ message: body.message })
		.eq("id", id)
		.select()
		.single();

	// Return a success response with a message indicating the update was successful
	return c.json({ message: "Response updated successfully" }, 200);
}

export default put_response;