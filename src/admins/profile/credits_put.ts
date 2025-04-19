import config from "../../config.ts";

async function put_credits(c: any) {
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

	const result = await config.supabaseClient
		.from("profiles")
		.update({ credits: json.credits })
		.eq("id", user_id);
	if (result.error != undefined)
		return c.json({ error: "Invalid credits format" }, 500);

	return c.json({ message: "Credits updated successfully" }, 200);
}

export default put_credits;
