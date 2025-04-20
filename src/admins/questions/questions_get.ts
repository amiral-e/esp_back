import config from "../../config.ts";

async function get_questions(c: any) {
	const user = c.get("user");
	if (!user.admin) return c.json({ error: "Forbidden" }, 403);

	const questions = await config.supabaseClient
		.from("questions")
		.select("id, question, level");
	if (questions.data == undefined || questions.data.length == 0)
		return c.json({ error: "No questions found" }, 404);

	return c.json({ questions: questions.data }, 200);
}

export default get_questions;
