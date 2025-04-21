import config from "../../config.ts";
import { getUser } from "../../middlewares/utils.ts";

/**
 * Inserts a new admin user.
 * 
 * @param c The context object containing the request and user information.
 * @returns A JSON response indicating the result of the operation.
 */
async function insert_admin(c: any) {
	const user = c.get("user");
	if (!user.admin) return c.json({ error: "Forbidden" }, 403);

	let request_uid = "";
	try {
		const json = await c.req.json();
		if (json?.user_id == undefined || typeof json?.user_id !== "string")
			throw new Error();
		request_uid = json.user_id;
	} catch (error) {
		return c.json({ error: "Invalid JSON" }, 400);
	}

	if (user.uid == request_uid)
		return c.json({ error: "You can't add yourself to admins" }, 400);

	const request_user = await getUser(request_uid);
	if (!request_user?.valid) return c.json({ error: "User not found" }, 404);
	else if (request_user.admin)
		return c.json({ error: "User is already an admin" }, 400);

	await config.supabaseClient
		.from("admins")
		.insert({ uid: request_uid })
		.select("*")
		.single();
	return c.json({ message: `User added to admins` }, 200);
}

export default insert_admin;
