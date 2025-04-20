import config from "../../config.ts";

async function post_conversation(c: any) {
	const user = c.get("user");

	let json: any;
	try {
		json = await c.req.json();
		if (json?.name == undefined) return c.json({ error: "Invalid JSON" }, 400);
	} catch (error) {
		return c.json({ error: "Invalid JSON" }, 400);
	}

	const insertion = await config.supabaseClient
		.from("conversations")
		.insert({ history: [], name: json.name, user_id: user.uid })
		.select("*")
		.single();
	return c.json(
		{ message: `Conversation created successfully`, id: insertion.data.id },
		200,
	);
}

export default post_conversation;
