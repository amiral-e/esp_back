import config from "../../config.ts";

/**
 * Retrieves questions for the current user based on their level.
 * 
 * @param c The context object containing information about the current user.
 * @returns A JSON response containing an array of questions or an error message if no questions are found.
 */
async function get_questions(c: any) {
	const user = c.get("user");

	const profile = await config.supabaseClient
		.from("profiles")
		.select("level")
		.eq("id", user.uid)
		.single();

	const questions = await config.supabaseClient
		.from("questions")
		.select("question")
		.eq("level", profile.data.level);
	if (questions.data == undefined || questions.data.length == 0)
		return c.json({ error: "No questions found" }, 404);

	return c.json({ questions: questions.data.map((l: any) => l.question) }, 200);
}

export default get_questions;
