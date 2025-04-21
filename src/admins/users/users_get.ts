import config from "../../config.ts";

/**
 * Gets all users from the database.
 * 
 * @param {any} c - The context object.
 * @returns {Promise<void>} A promise that resolves with a JSON response containing the users data.
 */
async function get_users(c: any) {
	// Retrieve the user object from the context
	const user = c.get("user");
	
	// Check if the user is an admin, if not, return a Forbidden response
	if (!user.admin) return c.json({ error: "Forbidden" }, 403);

	// Call the Supabase RPC function to retrieve all users
	const users = await config.supabaseClient.rpc("get_users");
	
	// Return a JSON response with the users data and a 200 status code
	return c.json({ users: users.data }, 200);
}

export default get_users;