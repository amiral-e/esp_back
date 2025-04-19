import config from "../../../config.ts";

async function get_categories(c: any) {
	const categories = await config.supabaseClient
		.from("categories")
		.select("*");

	if (categories.data == undefined || categories.data.length == 0)
		return c.json({ error: "No category found" }, 404);

	return c.json({ categories: categories.data }, 200);
}

export default get_categories;
