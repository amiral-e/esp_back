import config from "../../config.ts";

/**
 * Retrieves a list of prompts from the database.
 * 
 * @param c - The context object containing the request and user information.
 * @returns A JSON response with a list of prompts, or an error message if no prompts are found.
 */
async function get_prompts(c: any) {
  // Retrieve the user object from the context
	const user = c.get("user");

  // Check if the user is an admin, return a 403 error if not
	if (!user.admin) return c.json({ error: "Forbidden" }, 403);

  // Query the database for a list of prompts
	const prompts = await config.supabaseClient
		.from("prompts")
		.select("type, prompt");

  // Check if any prompts were found, return a 404 error if not
	if (prompts.data == undefined || prompts.data.length == 0)
		return c.json({ error: "No level found" }, 404);

  // Return a JSON response with the list of prompts
	return c.json({ prompts: prompts.data }, 200);
}

export default get_prompts;
