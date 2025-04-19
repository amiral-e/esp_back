import config from "../../../config.ts";

async function post_category(c: any) {
	const user = c.get("user");
	if (!user.admin) return c.json({ error: "Forbidden" }, 403);

	let json: any;
	try {
		json = await c.req.json();
		if (json?.name == undefined || json?.description == undefined)
			return c.json({ error: "Invalid JSON" }, 400);
	} catch (error) {
		return c.json({ error: "Invalid JSON" }, 400);
	}

	await config.supabaseClient
		.from("categories")
		.insert(json)
		.select("*");

	return c.json({ message: "Category created successfully" }, 200);
}

export default post_category;
