import config from "../../config.ts";
import { validateLevel } from "../../admins/questions/utils.ts";

/**
 * Updates a user's level.
 * 
 * @param c The request context.
 * @param user_id The ID of the user to update.
 * @returns The response to the request, or an error if the update failed.
 */
async function updateLevel(c: any, user_id: string) {
    // Try to parse the JSON from the request
	let json: any;
	try {
		json = await c.req.json();
		if (json?.level == undefined) return c.json({ error: "Invalid JSON" }, 400);
	} catch (error) {
        // If there's an error parsing the JSON, return a 400 error
		return c.json({ error: "Invalid JSON" }, 400);
	}

    // Validate the level
	const level = await validateLevel(c, json.level);
	if (level != null)
		return level;

    // Get the user's profile from the database
	const profile = await config.supabaseClient
		.from("profiles")
		.select("*")
		.eq("id", user_id)
		.single();
	if (profile.data == undefined)
        // If no profile is found, return a 404 error
		return c.json({ error: "No profile found" }, 404);

    // Update the level in the database
	await config.supabaseClient
		.from("profiles")
		.update({ level: json.level })
		.eq("id", user_id)
		.single();

    // Return a success message
	return c.json({ message: "Level updated successfully" }, 200);
}

/**
 * Updates a user's credits.
 * 
 * @param c The request context.
 * @param operation The operation to perform on the user's credits, either 'set' or 'add'.
 * @returns The response to the request, or an error if the update failed.
 */
async function updateCredits(c: any, operation: 'set' | 'add') {
    // Check if the user is an admin
	const user = c.get("user");
	if (!user.admin) return c.json({ error: "Forbidden" }, 403);

    // Get the user ID from the request parameters
	const { user_id } = await c.req.param();

    // Try to parse the JSON from the request
	let json: any;
	try {
		json = await c.req.json();
		if (json?.credits == undefined)
            // If the credits are missing from the JSON, return a 400 error
			return c.json({ error: "Invalid JSON" }, 400);
	} catch (error) {
        // If there's an error parsing the JSON, return a 400 error
		return c.json({ error: "Invalid JSON" }, 400);
	}

    // Calculate the new credits based on the operation
	let creditsToUpdate = json.credits;
	if (operation === 'add') {
        // If the operation is 'add', get the current credits from the database
		const userCredits = await config.supabaseClient
			.from("profiles")
			.select("credits")
			.eq("id", user_id)
			.single();

        // Add the new credits to the current credits
		creditsToUpdate = userCredits.data.credits + json.credits;
	}

    // Update the credits in the database
	const result = await config.supabaseClient
		.from("profiles")
		.update({ credits: creditsToUpdate })
		.eq("id", user_id);

    // If there's an error updating the credits, return a 500 error
	if (result.error != undefined)
		return c.json({ error: "Invalid credits format" }, 500);

    // Return a success message based on the operation
	return operation === 'set' ? 
		c.json({ message: "Credits updated successfully" }, 200) : 
		c.json({ message: "Credits granted successfully" }, 200);
}

export { updateLevel, updateCredits };
