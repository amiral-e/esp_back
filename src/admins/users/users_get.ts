import config from "../../config.ts";

/**
 * Gets all users from the database.
 * 
 * @param {any} c - The context object.
 * @returns {Promise<void>} A promise that resolves with a JSON response containing the users data.
 */
async function get_users(c: any) {
	const user = c.get("user");
	if (!user.admin) return c.json({ error: "Forbidden" }, 403);

	const users = await config.supabaseClient.rpc("get_users");
	return c.json({ users: users.data }, 200);
}

export default get_users;
