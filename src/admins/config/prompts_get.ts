import config from "../../config.ts";

async function get_prompts(c: any) {
	const user = c.get("user");
	if (!user.admin) return c.json({ error: "Forbidden" }, 403);

	const prompts = await config.supabaseClient
		.from("prompts")
		.select("type, prompt");
	if (prompts.data == undefined || prompts.data.length == 0)
		return c.json({ error: "No level found" }, 404);

	return c.json({ prompts: prompts.data }, 200);
}

export default get_prompts;
