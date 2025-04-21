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
	const user = c.get("user");
	let json: any;

	try {
		json = await c.req.json();
		if (json?.message == undefined)
			return c.json({ error: "Invalid JSON" }, 400);
	} catch (error) {
		return c.json({ error: "Invalid JSON" }, 400);
	}
	const input_tokens = json.message.length;

	const validate_credits = await check_credits(
		input_tokens,
		user.uid,
		false,
		false,
	);
	if (validate_credits != "Success")
		return c.json({ error: "Not enough credits" }, 402);

	const { conv_id } = c.req.param();
	const conversation = await config.supabaseClient
		.from("conversations")
		.select("*")
		.eq("user_id", user.uid)
		.eq("id", conv_id)
		.single();
	if (conversation.data == undefined || conversation.data.length == 0)
		return c.json({ error: "Conversation not found" }, 404);

	const knowledge_prompt = await get_knowledge_prompt(user.uid);

	let history = [];
	history.push({ role: "system", content: knowledge_prompt });
	if (conversation.data.history != undefined)
		history.push(...conversation.data.history);
	history.push({ role: "user", content: json.message });

	let response: any;
	try {
		response = await config.llm.chat({
			messages: JSON.parse(JSON.stringify(history)),
		});
	} catch (error: any) {
		console.error("LLM Error:", error instanceof Error ? error.message : error);
		if (error.message?.toLowerCase().includes("rate_limit_exceeded")) {
			console.log("Hit rate limit. Consider implementing retry logic.");
			return c.json({ error: "Rate limit exceeded" }, 500);
		}
		return c.json({ error: "Failed to process message" }, 500);
	}

	history.push({ role: "assistant", content: response.message.content });

	history = history.slice(1);
	await config.supabaseClient
		.from("conversations")
		.update({ history: history })
		.eq("id", conversation.data.id);

	await config.supabaseClient.rpc(
		"increment_total_messages",
		{ p_user_id: user.uid },
	);

	const input_results = await decrease_credits(
		input_tokens,
		user.uid,
		"groq_input",
	);
	if (input_results != "Success") return c.json({ error: input_results }, 500);

	const output_results = await decrease_credits(
		response.message.content.length,
		user.uid,
		"groq_output",
	);
	if (output_results != "Success")
		return c.json({ error: output_results }, 500);

	return c.json({ role: "assistant", content: response.message.content }, 200);
}

export default post_chat;
