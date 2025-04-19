import config from "../../config.ts";

async function delete_question(c: any) {
	const user = c.get("user");
	if (!user.admin) return c.json({ error: "Forbidden" }, 403);

	const { question_id } = c.req.param();

	const question = await config.supabaseClient
		.from("questions")
		.select("*")
		.eq("id", question_id)
		.single();
	if (question.data == undefined)
		return c.json({ error: "Question not found" }, 404);

	await config.supabaseClient
		.from("questions")
		.delete()
		.eq("id", question_id)
		.select("*")
		.single();
	return c.json({ message: "Question deleted successfully" }, 200);
}

export default delete_question;