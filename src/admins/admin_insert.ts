import config from "../config.ts";
import AdminMiddleware from "../middlewares/middleware_admin.ts";
import { Hono } from "hono";

const admin_insert = new Hono();

admin_insert.post(AdminMiddleware, async (c: any) => {
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
		return c.json({ error: "You can't add yourself to admins" }, 401);

	const { data, error } = await config.supabaseClient.rpc(
		"check_uid_exists",
		{ user_id: json.user_id },
	);
	if (data != undefined && data === false)
		return c.json({ error: "User not found" }, 401);
	else if (error)
		return c.json({ error: error.message }, 500);

	const { data: adminsData, error: adminsError } = await config.supabaseClient
		.from("admins")
		.select("*")
		.eq("user_id", json.user_id)
		.single();
	if (adminsData != undefined)
		return c.json({ error: "User is already an admin" }, 401);

	const { data: insertionData, error: insertionError } =
		await config.supabaseClient
			.from("admins")
			.insert({ user_id: json.user_id })
			.select("*")
			.single();
	if (insertionError != undefined)
		return c.json({ error: insertionError.message }, 500);
	return c.json({ message: `User ${json.user_id} added to admins` }, 200);
});

export default admin_insert;
