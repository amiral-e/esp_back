import config from "../../config.ts";

async function get_usage(c: any) {
	const user = c.get("user");

	const usage = await config.supabaseClient
		.from("usage")
		.select("month, used_credits, total_messages, total_docs, total_reports")
		.eq("user_id", user.uid);
	if (usage.data == undefined) return c.json({ error: "No usage found" }, 404);

	return c.json({ usage: usage.data }, 200);
}

export default get_usage;
