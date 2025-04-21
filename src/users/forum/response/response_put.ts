import config from "../../../config.ts";

/**
 * Updates an existing response in the database.
 * 
 * @param {any} c - The context object containing the user information and request data.
 * @returns {Promise<any>} A JSON response with a success message.
 */
async function put_response(c: any) {
	const user = c.get("user");
	const id = c.req.param("id");
	let body: any;

	try {
		body = await c.req.json();
		if (!body?.message?.trim()) {
			return c.json({ error: "Invalid JSON body" }, 400);
		}
	} catch (error) {
		return c.json({ error: "Invalid JSON body" }, 400);
	}

	const response = await config.supabaseClient
		.from("responses")
		.select("*")
		.eq("id", id)
		.single();

	if (response.data == undefined || response.data.length == 0)
		return c.json({ error: "Response not found" }, 404);

	if (user.uid != response.data.user_id)
		return c.json({ error: "Forbidden" }, 403);

	await config.supabaseClient
		.from("responses")
		.update({ message: body.message })
		.eq("id", id)
		.select()
		.single();

	return c.json({ message: "Response updated successfully" }, 200);
}

export default put_response;
