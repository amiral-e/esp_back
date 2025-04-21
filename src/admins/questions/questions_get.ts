import config from "../../config.ts";

/**
 * Retrieves a list of all questions from the database.
 * 
 * @param c The context object containing the HTTP request and response.
 * @returns A JSON response containing the list of questions.
 */
async function get_questions(c: any) {
	// Retrieve the user object from the context
	const user = c.get("user");
	// Check if the user is an admin, return a 403 error if not
	if (!user.admin) return c.json({ error: "Forbidden" }, 403);

	// Query the database for a list of questions
	const questions = await config.supabaseClient
		.from("questions")
		.select("id, question, level");
	// Check if the query returned any results
	if (questions.data == undefined || questions.data.length == 0)
		// Return a 404 error if no questions were found
		return c.json({ error: "No questions found" }, 404);

	// Return a JSON response containing the list of questions
	return c.json({ questions: questions.data }, 200);
}

export default get_questions;