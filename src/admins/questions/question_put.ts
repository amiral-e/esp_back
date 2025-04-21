import config from "../../config.ts";
import { validateRequest } from "./utils.ts";

/**
 * Updates an existing question in the database.
 * 
 * @param c The context object containing the HTTP request and response.
 * @returns A JSON response indicating whether the question was updated successfully.
 */
async function put_question(c: any) {
	const user = c.get("user");
	if (!user.admin) return c.json({ error: "Forbidden" }, 403);

	const { question_id } = await c.req.param();

	const json = await validateRequest(c);
	if (json instanceof Response) return json;

	const update = await config.supabaseClient
		.from("questions")
		.update({ question: json.question, level: json.level })
		.eq("id", question_id)
		.select("*")
		.single();
	if (update.data == undefined)
		return c.json({ error: "Question not found" }, 404);

	return c.json({ message: "Question updated successfully" }, 200);
}

export default put_question;
