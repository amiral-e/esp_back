import config from "../../config.ts";

/**
 * Creates a new question in the database with default values.
 * 
 * @returns The ID of the newly created question, or false if the creation failed.
 */
async function createQuestion() {
	try {
		// Insert a new question into the database with default values
		const question = await config.supabaseClient
			.from("questions")
			.insert({ question: "Wassup dawg", level: "beginner" })
			.select("id")
			.single();
		// Check if there was an error during the insertion
		if (question.error != undefined) return false;
		// Return the ID of the newly created question
		return question.data.id;
	} catch (error: any) {
		// Log any errors that occur during the question creation process
		console.error("Error creating price:", error.message);
		return error.message;
	}
}

/**
 * Deletes a question from the database by its ID.
 * 
 * @param id The ID of the question to delete.
 * @throws An error if the deletion fails.
 */
async function deleteQuestion(id: string) {
	// Delete the question from the database by its ID
	const { error: deleteError } = await config.supabaseClient
		.from("questions")
		.delete()
		.eq("id", id);

	// Check if there was an error during the deletion
	if (deleteError) {
		// Throw the error if the deletion fails
		throw deleteError;
	}
}

/**
 * Validates a level by checking if it exists in the database.
 * 
 * @param c The context object containing the HTTP request and response.
 * @param json_level The level to validate.
 * @returns A JSON response indicating an error if the level is invalid, or null if the level is valid.
 */
async function validateLevel(c: any, json_level: string) {
	// Retrieve all levels from the database
	const levels = await config.supabaseClient
		.from("prompts")
		.select("id, type")
		.eq("knowledge", true);
	// Check if no levels were found in the database
	if (levels.data == undefined || levels.data.length == 0)
		// Return an error response if no levels were found
		return c.json({ error: "No level found" }, 404);

	// Check if the provided level matches any of the levels in the database
	if (!levels.data.some((level: any) => level.type == json_level))
		// Return an error response if the level is invalid
		return c.json({ error: "Invalid level" }, 400);

	// Return null if the level is valid
	return null;
}

/**
 * Validates an incoming request by checking if it contains the required question and level fields.
 * 
 * @param c The context object containing the HTTP request and response.
 * @returns The parsed JSON object if the request is valid, or a JSON response indicating an error if the request is invalid.
 */
async function validateRequest(c: any) {
	let json: any;
	try {
		// Attempt to parse the JSON body of the incoming request
		json = await c.req.json();
		// Check if the required question and level fields are present in the request
		if (json?.question == undefined || json?.level == undefined)
			// Return an error response if the request is invalid
			return c.json({ error: "Invalid JSON" }, 400);
	} catch (error) {
		// Return an error response if the JSON parsing fails
		return c.json({ error: "Invalid JSON" }, 400);
	}

	// Validate the level in the request
	const level = await validateLevel(c, json.level);
	// Check if the level validation failed
	if (level != null)
		// Return the error response if the level is invalid
		return level;

	// Return the parsed JSON object if the request is valid
	return json;
}

export { createQuestion, deleteQuestion, validateRequest, validateLevel };
