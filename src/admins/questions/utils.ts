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

export { createQuestion, deleteQuestion };
