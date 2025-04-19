import config from "../../config.ts";

async function put_question(c: any) {
	const user = c.get("user");
	if (!user.admin) return c.json({ error: "Forbidden" }, 403);

	const { question_id } = await c.req.param();

	let json: any;
	try {
		json = await c.req.json();
		if (json?.question == undefined || json?.level == undefined)
			return c.json({ error: "Invalid JSON" }, 400);
	} catch (error) {
		return c.json({ error: "Invalid JSON" }, 400);
	}

	const levels = await config.supabaseClient
		.from("prompts")
		.select("id, type")
		.eq("knowledge", true);
	if (levels.data == undefined || levels.data.length == 0)
		return c.json({ error: "No level found" }, 404);

	if (!levels.data.some((level: any) => level.type == json.level))
		return c.json({ error: "Invalid level" }, 400);

	const result = await config.supabaseClient
		.from("questions")
		.update({ question: json.question, level: json.level })
		.eq("id", question_id)
		.select("*")
		.single();
	if (result.data == undefined)
		return c.json({ error: "Question not found" }, 404);

	return c.json({ message: "Question updated successfully" }, 200);
}

export default put_question;