import config from "../../config.ts";

/**
 * Deletes a question from the database.
 * 
 * @param c The context object containing the HTTP request and response.
 * @returns A JSON response indicating whether the question was deleted successfully.
 */
async function delete_question(c: any) {
	// First, we retrieve the user object from the context to check their admin status
	const user = c.get("user");
	// If the user is not an admin, we return a 403 Forbidden response
	if (!user.admin) return c.json({ error: "Forbidden" }, 403);

	// We extract the question ID from the request parameters
	const { question_id } = c.req.param();

	// Then, we query the database to retrieve the question with the given ID
	const question = await config.supabaseClient
		.from("questions")
		.select("*")
		.eq("id", question_id)
		.single();
	// If the question is not found, we return a 404 Not Found response
	if (question.data == undefined)
		return c.json({ error: "Question not found" }, 404);

	// Finally, we delete the question from the database
	await config.supabaseClient
		.from("questions")
		.delete()
		.eq("id", question_id)
		.select("*")
		.single();
	// And return a successful response
	return c.json({ message: "Question deleted successfully" }, 200);
}

export default delete_question;