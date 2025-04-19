import config from "../../../config.ts";

async function put_category(c: any) {
	const user = c.get("user");
	if (!user.admin) return c.json({ error: "Forbidden" }, 403);

	const { id } = await c.req.param();

	let json: any;
	try {
		json = await c.req.json();
		if (json?.name == undefined && json?.description == undefined)
			return c.json({ error: "Invalid JSON" }, 400);
	} catch (error) {
		return c.json({ error: "Invalid JSON" }, 400);
	}

	const categorie = await config.supabaseClient
		.from("categories")
		.select("name")
		.eq("id", id)
		.single();
	if (categorie.data == undefined || categorie.data.length == 0)
		return c.json({ error: "Category not found" }, 404);

	await config.supabaseClient.from("categories").update(json).eq("id", id);

	return c.json({ message: "Category updated successfully" }, 200);
}

export default put_category;
