import config from "../../config.ts";

/**
 * Generates a prompt to add context to a query based on a conversation history.
 * 
 * @param history The conversation history.
 * @param query The query to add context to.
 * @returns A prompt to add context to the query.
 */
function get_prompt(history: any[], query: string): string {
	// Create a prompt that includes the conversation history and the query
	const context_prompt = `Chat history is below.
---------------------
${JSON.stringify(history)}
---------------------
If the chat history is revelant to the query, modify the query to incorporate the chat history.
If it's not relevant, return the query unchanged.
Don't answer the user's message directly or introduce additional information.

Query: ${query}
New query:`;

	// Return the generated prompt
	return context_prompt;
}

/**
 * Adds context to a query based on a conversation history.
 * 
 * @param history The conversation history.
 * @param query The query to add context to.
 * @returns The query with context added.
 */
async function add_context_to_query(
	history: any[],
	query: string,
): Promise<string> {
	try {
		// Generate a prompt to add context to the query
		const prompt = get_prompt(history, query);
		
		// Send the prompt to the LLM to get a response
		const response = await config.llm.chat({
			messages: [{ role: "user", content: prompt }],
		});
		
		// Extract the response content and return it as the query with context added
		return response.message.content as string;
	} catch (error: any) {
		// Log any errors that occur during the process
		console.error("LLM Error:", error instanceof Error ? error.message : error);
		
		// Check if the error is due to a rate limit being exceeded
		if (error.message?.toLowerCase().includes("rate_limit_exceeded")) {
			// Log a message indicating that the rate limit has been hit
			console.log("Hit rate limit. Consider implementing retry logic.");
			// Throw an error to indicate that the rate limit has been exceeded
			throw new Error("Rate limit exceeded");
		}
		// If the error is not due to a rate limit, throw a generic error
		throw new Error("Failed to process message");
	}
}

/**
 * Retrieves a knowledge prompt for a user based on their level.
 * 
 * @param uid The user's ID.
 * @returns The knowledge prompt for the user.
 */
async function get_knowledge_prompt(uid: string) {
	try {
		// Retrieve the user's profile from the database
		const { data: profile, error: profile_error } = await config.supabaseClient
			.from("profiles")
			.select("*")
			.eq("id", uid)
			.single();
		
		// Check if an error occurred while retrieving the profile
		if (profile_error != undefined) {
			// Throw an error if the profile could not be retrieved
			throw new Error("Failed to get profile");
		}
		
		// Retrieve the knowledge prompt for the user's level from the database
		const { data: knowledge, error: knowledge_error } =
			await config.supabaseClient
				.from("prompts")
				.select("*")
				.eq("type", profile.level)
				.single();
		
		// Check if an error occurred while retrieving the knowledge prompt
		if (knowledge_error != undefined) {
			// Throw an error if the knowledge prompt could not be retrieved
			throw new Error("Failed to get knowledge");
		}
		
		// Return the retrieved knowledge prompt
		return knowledge.prompt;
	} catch (error) {
		// Log any errors that occur during the process
		console.error(error);
		// Rethrow the error
		throw error;
	}
}

export { add_context_to_query, get_knowledge_prompt };
