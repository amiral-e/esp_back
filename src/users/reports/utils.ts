import config from "../../config.ts";

/**
 * Retrieves the report prompt from the database.
 * 
 * @returns The report prompt as a string.
 */
async function get_report_prompt() {
	try {
		const { data: prompt, error: prompt_error } = await config.supabaseClient
			.from("prompts")
			.select("*")
			.eq("type", "report")
			.single();
		if (prompt_error != undefined) throw new Error("Failed to get prompt");
		return prompt.prompt;
	} catch (error) {
		console.error("Failed to get prompt");
		throw error;
	}
}

/**
 * Processes a query using the language model.
 * 
 * @param query The user's query to process.
 * @returns The processed query response as a string.
 */
async function process_query(query: string) {
	try {
		const { data: prompt, error: prompt_error } = await config.supabaseClient
			.from("prompts")
			.select("*")
			.eq("type", "search_query")
			.single();
		if (prompt_error != undefined) throw new Error("Failed to get prompt");
		const history = [{ role: "system", content: prompt.prompt }];
		history.push({ role: "user", content: "User's query: " + query });

		const response = await config.llm.chat({
			messages: JSON.parse(JSON.stringify(history)),
		});
		return response.message.content as string;
	} catch (error: any) {
		console.error("LLM Error:", error instanceof Error ? error.message : error);
		if (error.message?.toLowerCase().includes("rate_limit_exceeded")) {
			console.log("Hit rate limit. Consider implementing retry logic.");
			throw new Error("Rate limit exceeded");
		}
		throw new Error("Failed to process message");
	}
}

/**
 * Creates a new report for a given user.
 * 
 * @param userId The ID of the user creating the report.
 * @returns The ID of the newly created report.
 */
async function createReport(userId: string) {
	const { data, error: createError } = await config.supabaseClient
		.from("reports")
		.insert({ user_id: userId, title: "My report", text: "This is my report" })
		.select("*")
		.single();
	if (createError) {
		throw createError;
	}
	return data.id;
}

/**
 * Deletes a report by its ID.
 * 
 * @param report_id The ID of the report to delete.
 */
async function deleteReport(report_id: string) {
	const { error: deleteError } = await config.supabaseClient
		.from("reports")
		.delete()
		.eq("id", report_id);
	if (deleteError) {
		throw deleteError;
	}
}

export { get_report_prompt, process_query, createReport, deleteReport };
