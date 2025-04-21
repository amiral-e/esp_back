import config from "../../config.ts";

/**
 * Creates a new question in the database with default values.
 * 
 * @returns The ID of the newly created question, or false if the creation failed.
 */
async function createQuestion() {
	try {
		const question = await config.supabaseClient
			.from("questions")
			.insert({ question: "Wassup dawg", level: "beginner" })
			.select("id")
			.single();
		if (question.error != undefined) return false;
		return question.data.id;
	} catch (error: any) {
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
	const { error: deleteError } = await config.supabaseClient
		.from("questions")
		.delete()
		.eq("id", id);

	if (deleteError) {
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
	const levels = await config.supabaseClient
		.from("prompts")
		.select("id, type")
		.eq("knowledge", true);
	if (levels.data == undefined || levels.data.length == 0)
		return c.json({ error: "No level found" }, 404);

	if (!levels.data.some((level: any) => level.type == json_level))
		return c.json({ error: "Invalid level" }, 400);

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
		json = await c.req.json();
		if (json?.question == undefined || json?.level == undefined)
			return c.json({ error: "Invalid JSON" }, 400);
	} catch (error) {
		return c.json({ error: "Invalid JSON" }, 400);
	}

	const level = await validateLevel(c, json.level);
	if (level != null)
		return level;

	return json;
}

export { createQuestion, deleteQuestion, validateRequest, validateLevel };
