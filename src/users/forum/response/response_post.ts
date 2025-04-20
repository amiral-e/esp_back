import config from "../../../config.ts";

async function post_response(c: any) {
	const user = c.get("user");
	let body: any;

	try {
		body = await c.req.json();
		if (!body?.message) {
			return c.json({ error: "Message is required" }, 400);
		}
	} catch (error) {
		return c.json({ error: "Invalid JSON body" }, 400);
	}

	const insertion = await config.supabaseClient
		.from("responses")
		.insert({ message: body.message, user_id: user.uid })
		.select()
		.single();

	return c.json(
		{ message: "Response added successfully", id: insertion.data.id },
		200,
	);
}

export default post_response;
