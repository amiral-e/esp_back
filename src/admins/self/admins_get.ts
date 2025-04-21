import config from "../../config.ts";

/**
 * Retrieves a list of admin users.
 * 
 * @param c The context object containing the request and user information.
 * @returns A JSON response containing the list of admin users.
 */
async function get_admins(c: any) {
	// Retrieve the user object from the context
	const user = c.get("user");
	
	// Check if the user is an admin, if not return a 403 Forbidden response
	if (!user.admin) return c.json({ error: "Forbidden" }, 403);

	// Query the supabase database to retrieve a list of admin user IDs
	const admins = await config.supabaseClient.from("admins").select("uid");

	// Iterate over each admin and retrieve their email address using a supabase RPC function
	for (const admin of admins.data) {
		// Call the get_email RPC function with the admin's user ID to retrieve their email
		const email = await config.supabaseClient.rpc("get_email", {
			user_id: admin.uid,
		});
		// Add the email address to the admin object
		admin.email = email.data;
	}
	// Return a JSON response containing the list of admins with their email addresses
	return c.json({ admins: admins.data }, 200);
}

export default get_admins;