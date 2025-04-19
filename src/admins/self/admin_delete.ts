import config from "../../config.ts";
import { getUser } from "../../middlewares/utils.ts";

async function delete_admin(c: any) {
	const user = c.get("user");
	if (!user.admin) return c.json({ error: "Forbidden" }, 403);

	let request_uid = "";
	try {
		const json = await c.req.json();
		if (!json?.user_id || typeof json?.user_id !== "string") throw new Error();
		request_uid = json.user_id;
	} catch (error) {
		return c.json({ error: "Invalid JSON" }, 400);
	}

	if (user.uid == request_uid)
		return c.json({ error: "You can't remove yourself from admins" }, 400);

	const request_user = await getUser(request_uid);
	if (!request_user?.valid) return c.json({ error: "User not found" }, 404);
	else if (!request_user?.admin)
		return c.json({ error: "User is not an admin" }, 400);

	await config.supabaseClient
		.from("admins")
		.delete()
		.eq("uid", request_uid)
		.select("*")
		.single();
	return c.json({ message: "User removed from admins" }, 200);
}

export default delete_admin;
