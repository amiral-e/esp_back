import config from "../../config.ts";

async function createQuestion() {
	try {
		// Create question
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

async function deleteQuestion(id: string) {
	const { error: deleteError } = await config.supabaseClient
		.from("questions")
		.delete()
		.eq("id", id);

	if (deleteError) {
		throw deleteError;
	}
}

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
