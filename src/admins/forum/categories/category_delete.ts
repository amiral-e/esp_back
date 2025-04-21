import config from "../../../config.ts";

/**
 * Deletes a category from the database.
 * 
 * @param {any} c The context object containing the request and response.
 * @returns {Promise<void>} A promise that resolves when the category has been deleted.
 */
async function delete_category(c: any) {
	const user = c.get("user");
	if (!user.admin) return c.json({ error: "Forbidden" }, 403);

	const { id } = await c.req.param();

	const categories = await config.supabaseClient
		.from("categories")
		.select("*")
		.eq("id", id)
		.single();
	if (categories.data == undefined || categories.data.length == 0)
		return c.json({ error: "Category not found" }, 404);

	await config.supabaseClient
		.from("categories")
		.delete()
		.eq("id", id)
		.select("*");

	return c.json({ message: "Category deleted successfully" }, 200);
}

export default delete_category;
