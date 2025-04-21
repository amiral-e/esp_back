import config from "../../config.ts";
import { getUser } from "../../middlewares/utils.ts";

/**
 * Deletes an admin user.
 * 
 * @param c The context object containing the request and user information.
 * @returns A JSON response indicating the result of the operation.
 */
async function delete_admin(c: any) {
	// Get the current user from the context
	const user = c.get("user");
	// Check if the current user is an admin, if not, return a Forbidden response
	if (!user.admin) return c.json({ error: "Forbidden" }, 403);

	let request_uid = "";
	try {
		// Attempt to parse the JSON from the request body
		const json = await c.req.json();
		// Validate the JSON to ensure it contains a 'user_id' property of type string
		if (!json?.user_id || typeof json?.user_id !== "string") throw new Error();
		// Store the user ID from the request body
		request_uid = json.user_id;
	} catch (error) {
		// If the JSON is invalid, return a Bad Request response
		return c.json({ error: "Invalid JSON" }, 400);
	}

	// Check if the user is attempting to delete themselves, if so, return an error
	if (user.uid == request_uid)
		return c.json({ error: "You can't remove yourself from admins" }, 400);

	// Retrieve the user to be deleted from the database
	const request_user = await getUser(request_uid);
	// If the user is not found, return a Not Found response
	if (!request_user?.valid) return c.json({ error: "User not found" }, 404);
	// If the user is not an admin, return a Bad Request response
	else if (!request_user?.admin)
		return c.json({ error: "User is not an admin" }, 400);

	// Delete the user from the 'admins' table in the database
	await config.supabaseClient
		.from("admins")
		.delete()
		.eq("uid", request_uid)
		.select("*")
		.single();
	// Return a successful response
	return c.json({ message: "User removed from admins" }, 200);
}

export default delete_admin;