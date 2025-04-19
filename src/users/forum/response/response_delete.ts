import config from "../../../config.ts";
import { isAdmin } from "../../../admins/utils.ts";

async function delete_response(c: any) {
	const user = c.get("user");
	const id = c.req.param("id");

	const response = await config.supabaseClient
		.from("responses")
		.select("*")
		.eq("id", id)
		.single();

	if (response.data == undefined || response.data.length == 0)
		return c.json({ error: "Response not found" }, 404);

	const is_admin = await isAdmin(user.uid);
	if (user.uid != response.data.user_id && !is_admin)
		return c.json({ error: "Forbidden" }, 403);

	const deletion = await config.supabaseClient
		.from("responses")
		.delete()
		.eq("id", id);

	return c.json({ message: "Response deleted successfully" }, 200);
}

export default delete_response;
