import config from "../../config.ts";

async function put_conversation(c: any) {
	const user = c.get("user");
	let json: any;

	try {
		json = await c.req.json();
		if (json?.name == undefined)
			return c.json({ error: "Invalid JSON" }, 400);
	} catch (error) {
		return c.json({ error: "Invalid JSON" }, 400);
	}
	const { conv_id } = c.req.param();

	const conversation = await config.supabaseClient
		.from("conversations")
		.select("*")
		.eq("user_id", user.uid)
		.eq("id", conv_id)
		.single();
	if (conversation.data == undefined || conversation.data.length == 0)
		return c.json({ error: "Conversation not found" }, 404);

	const update = await config.supabaseClient
		.from("conversations")
		.update({ name: json.name })
		.eq("id", conversation.data.id);

	return c.json({ message: `Conversation updated successfully` }, 200);
}

export default put_conversation;
