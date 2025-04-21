import config from "../../config.ts";
import { getUser } from "../../middlewares/utils.ts";

/**
 * Inserts a new admin user.
 * 
 * @param c The context object containing the request and user information.
 * @returns A JSON response indicating the result of the operation.
 */
async function insert_admin(c: any) {
	// Retrieve the user from the context object
	const user = c.get("user");
	
	// Check if the requesting user is an admin, return 403 if not
	if (!user.admin) return c.json({ error: "Forbidden" }, 403);

	let request_uid = "";
	try {
		// Attempt to parse the request body as JSON
		const json = await c.req.json();
		
		// Validate the request body, checking for a valid user_id
		if (json?.user_id == undefined || typeof json?.user_id !== "string")
			throw new Error();
		request_uid = json.user_id;
	} catch (error) {
		// Return 400 if the request body is invalid JSON
		return c.json({ error: "Invalid JSON" }, 400);
	}

	// Prevent a user from adding themselves to the admin list
	if (user.uid == request_uid)
		return c.json({ error: "You can't add yourself to admins" }, 400);

	// Retrieve the user to be added to the admin list
	const request_user = await getUser(request_uid);
	
	// Check if the user exists, return 404 if not
	if (!request_user?.valid) return c.json({ error: "User not found" }, 404);
	
	// Check if the user is already an admin, return 400 if so
	else if (request_user.admin)
		return c.json({ error: "User is already an admin" }, 400);

	// Insert the user into the admins table
	await config.supabaseClient
		.from("admins")
		.insert({ uid: request_uid })
		.select("*")
		.single();
	
	// Return a success message
	return c.json({ message: `User added to admins` }, 200);
}

export default insert_admin;