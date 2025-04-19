import config from "../../config.ts";

async function post_question(c: any) {
	const user = c.get("user");
	if (!user.admin) return c.json({ error: "Forbidden" }, 403);

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
		.insert({ question: json.question, level: json.level })
		.select("*")
		.single()
	if (result.error != undefined)
		return c.json({ error: result.error.message }, 500);

	return c.json({ message: "Question added successfully", id: result.data.id }, 200);
}

export default post_question;