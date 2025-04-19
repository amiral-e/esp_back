import config from "../../config.ts";

async function post_credits(c: any) {
	const user = c.get("user");
	if (!user.admin) return c.json({ error: "Forbidden" }, 403);

	const { user_id } = await c.req.param();

	let json: any;
	try {
		json = await c.req.json();
		if (json?.credits == undefined)
			return c.json({ error: "Invalid JSON" }, 400);
	} catch (error) {
		return c.json({ error: "Invalid JSON" }, 400);
	}

	const credits = await config.supabaseClient
		.from("profiles")
		.select("credits")
		.eq("id", user_id)
		.single();

	const result = await config.supabaseClient
		.from("profiles")
		.update({ credits: credits.data.credits + json.credits })
		.eq("id", user_id);
	if (result.error != undefined)
		return c.json({ error: "Invalid credits format" }, 500);

	return c.json({ message: "Credits granted successfully" }, 200);
}

export default post_credits;
