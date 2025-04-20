import config from "../../config.ts";
import { validateRequest } from "./utils.ts"

async function post_question(c: any) {
	const user = c.get("user");
	if (!user.admin) return c.json({ error: "Forbidden" }, 403);

	const json = await validateRequest(c);
	if (json instanceof Response) return json;

	const insertion = await config.supabaseClient
		.from("questions")
		.insert({ question: json.question, level: json.level })
		.select("*")
		.single();
	if (insertion.error != undefined)
		return c.json({ error: insertion.error.message }, 500);

	return c.json(
		{ message: "Question added successfully", id: insertion.data.id },
		200,
	);
}

export default post_question;
