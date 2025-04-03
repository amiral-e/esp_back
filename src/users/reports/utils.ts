import config from "../../config.ts";

async function get_report_prompt() {
	try {
		const { data: prompt, error: prompt_error } = await config.supabaseClient
			.from("prompts")
			.select("*")
			.eq("type", "report")
			.single();
		if (prompt_error != undefined)
			throw new Error("Failed to get prompt");
		return prompt.prompt
	} catch (error) {
		throw error;
	}
}

export { get_report_prompt };