import config from "../../config.ts";

/**
 * Retrieves the report prompt from the database.
 * 
 * @returns The report prompt as a string.
 */
async function get_report_prompt() {
	try {
		// Query the database for the report prompt
		const { data: prompt, error: prompt_error } = await config.supabaseClient
			.from("prompts")
			.select("*")
			.eq("type", "report")
			.single();
		// Check if there was an error retrieving the prompt
		if (prompt_error != undefined) throw new Error("Failed to get prompt");
		// Return the retrieved prompt
		return prompt.prompt;
	} catch (error) {
		// Log and rethrow any errors that occur
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
		// Retrieve the search query prompt from the database
		const { data: prompt, error: prompt_error } = await config.supabaseClient
			.from("prompts")
			.select("*")
			.eq("type", "search_query")
			.single();
		// Check if there was an error retrieving the prompt
		if (prompt_error != undefined) throw new Error("Failed to get prompt");
		// Create a conversation history with the system and user messages
		const history = [{ role: "system", content: prompt.prompt }];
		history.push({ role: "user", content: "User's query: " + query });
		// Use the language model to process the query
		const response = await config.llm.chat({
			messages: JSON.parse(JSON.stringify(history)),
		});
		// Return the processed response
		return response.message.content as string;
	} catch (error: any) {
		// Log any errors that occur, and handle rate limit exceeded errors
		console.error("LLM Error:", error instanceof Error ? error.message : error);
		if (error.message?.toLowerCase().includes("rate_limit_exceeded")) {
			// Log a message suggesting that retry logic should be implemented
			console.log("Hit rate limit. Consider implementing retry logic.");
			// Throw a rate limit exceeded error
			throw new Error("Rate limit exceeded");
		}
		// Rethrow any other errors
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
	// Insert a new report into the database
	const { data, error: createError } = await config.supabaseClient
		.from("reports")
		.insert({ user_id: userId, title: "My report", text: "This is my report" })
		.select("*")
		.single();
	// Check if there was an error creating the report
	if (createError) {
		// Rethrow the error
		throw createError;
	}
	// Return the ID of the newly created report
	return data.id;
}

/**
 * Delete all reports.
 * 
 */
async function deleteReports() {
  // Delete reports from the database
	const { error: deleteError } = await config.supabaseClient
		.from("reports")
		.delete()
		.neq("id", 0);
	if (deleteError) {
		// Rethrow the error
		throw deleteError;
	}
}

export { get_report_prompt, process_query, createReport, deleteReports };
