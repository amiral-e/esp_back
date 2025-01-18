import config from "../config.ts";
import AdminMiddleware from "../middlewares/middleware_admin.ts";
import { Hono } from "hono";

const admin_delete = new Hono();

admin_delete.delete(AdminMiddleware, async (c: any) => {
	const user = c.get("user");
	let json: any;
	try {
		json = await c.req.json();
		if (!json || json.user_id == undefined)
			return c.json({ error: "Invalid JSON" }, 400);
	} catch (error) {
		return c.json({ error: "Invalid JSON" }, 400);
	}

	if (user.uid == json.user_id)
		return c.json({ error: "You can't remove yourself from admins" }, 401);

	const { data: adminsData, error: adminsError } = await config.supabaseClient
		.from("admins")
		.select("*")
		.eq("user_id", json.user_id)
		.single();
	if (adminsData == undefined || adminsData.length == 0)
		return c.json({ error: "User is not an admin" }, 401);
	else if (adminsError != undefined)
		return c.json({ error: adminsError.message }, 500);

	const { data: deletionData, error: deletionError } =
		await config.supabaseClient
			.from("admins")
			.delete()
			.eq("user_id", json.user_id)
			.select("*")
			.single();
	if (deletionError != undefined)
		return c.json({ error: deletionError.message }, 500);
	return c.json({ message: `User ${json.user_id} removed from admins` }, 200);
});

export default admin_delete;
