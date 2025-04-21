import config from "../../config.ts";

import { decrease_credits, check_credits } from "../profile/utils.ts";
import { get_knowledge_prompt } from "./utils.ts";

/**
 * Handles a chat post request.
 * 
 * @param c The request context.
 * @returns A response to the chat post request.
 */
async function post_chat(c: any) {
	// Get the user from the request context
	const user = c.get("user");
	let json: any;

	try {
		// Attempt to parse the JSON from the request body
		json = await c.req.json();
		if (json?.message == undefined)
			// Return an error if the JSON is invalid
			return c.json({ error: "Invalid JSON" }, 400);
	} catch (error) {
		// Return an error if there's an issue parsing the JSON
		return c.json({ error: "Invalid JSON" }, 400);
	}

	// Calculate the number of input tokens
	const input_tokens = json.message.length;

	// Validate the user's credits for the input
	const validate_credits = await check_credits(
		input_tokens,
		user.uid,
		false,
		false,
	);
	if (validate_credits != "Success")
		// Return an error if the user doesn't have enough credits
		return c.json({ error: "Not enough credits" }, 402);

	// Get the conversation ID from the request parameters
	const { conv_id } = c.req.param();
	// Fetch the conversation from the database
	const conversation = await config.supabaseClient
		.from("conversations")
		.select("*")
		.eq("user_id", user.uid)
		.eq("id", conv_id)
		.single();
	if (conversation.data == undefined || conversation.data.length == 0)
		// Return an error if the conversation is not found
		return c.json({ error: "Conversation not found" }, 404);

	// Get the knowledge prompt for the user
	const knowledge_prompt = await get_knowledge_prompt(user.uid);

	// Initialize the chat history
	let history = [];
	// Add the system message (knowledge prompt) to the history
	history.push({ role: "system", content: knowledge_prompt });
	// Add the existing conversation history to the history
	if (conversation.data.history != undefined)
		history.push(...conversation.data.history);
	// Add the user's message to the history
	history.push({ role: "user", content: json.message });

	// Initialize the response variable
	let response: any;
	try {
		// Send the chat history to the language model and get a response
		response = await config.llm.chat({
			messages: JSON.parse(JSON.stringify(history)),
		});
	} catch (error: any) {
		// Log any errors that occur during the LLM request
		console.error("LLM Error:", error instanceof Error ? error.message : error);
		// Check if the error is due to a rate limit being exceeded
		if (error.message?.toLowerCase().includes("rate_limit_exceeded")) {
			// Log a message suggesting retry logic be implemented
			console.log("Hit rate limit. Consider implementing retry logic.");
			// Return an error response
			return c.json({ error: "Rate limit exceeded" }, 500);
		}
		// Return an error response for any other error
		return c.json({ error: "Failed to process message" }, 500);
	}

	// Add the LLM's response to the history
	history.push({ role: "assistant", content: response.message.content });

	// Remove the system message from the history
	history = history.slice(1);
	// Update the conversation history in the database
	await config.supabaseClient
		.from("conversations")
		.update({ history: history })
		.eq("id", conversation.data.id);

	// Increment the total messages count for the user
	await config.supabaseClient.rpc(
		"increment_total_messages",
		{ p_user_id: user.uid },
	);

	// Decrease the user's credits for the input
	const input_results = await decrease_credits(
		input_tokens,
		user.uid,
		"groq_input",
	);
	if (input_results != "Success") 
		// Return an error if the credit decrease fails
		return c.json({ error: input_results }, 500);

	// Decrease the user's credits for the output
	const output_results = await decrease_credits(
		response.message.content.length,
		user.uid,
		"groq_output",
	);
	if (output_results != "Success")
		// Return an error if the credit decrease fails
		return c.json({ error: output_results }, 500);

	// Return the LLM's response
	return c.json({ role: "assistant", content: response.message.content }, 200);
}

export default post_chat;