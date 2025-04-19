import config from "../../config.ts";

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
