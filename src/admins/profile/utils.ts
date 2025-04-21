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
	let json: any;
	try {
		json = await c.req.json();
		if (json?.level == undefined) return c.json({ error: "Invalid JSON" }, 400);
	} catch (error) {
		return c.json({ error: "Invalid JSON" }, 400);
	}

	const level = await validateLevel(c, json.level);
	if (level != null)
		return level;

	const profile = await config.supabaseClient
		.from("profiles")
		.select("*")
		.eq("id", user_id)
		.single();
	if (profile.data == undefined)
		return c.json({ error: "No profile found" }, 404);

	await config.supabaseClient
		.from("profiles")
		.update({ level: json.level })
		.eq("id", user_id)
		.single();

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
	const user = c.get("user");
	if (!user.admin) return c.json({ error: "Forbidden" }, 403);

	const { user_id } = await c.req.param();

	let json: any;
	try {
		json = await c.req.json();
		if (json?.credits == undefined)
			return c.json({ error: "Invalid JSON" }, 400);
	} catch (error) {
		return c.json({ error: "Invalid JSON" }, 400);
	}

	let creditsToUpdate = json.credits;
	if (operation === 'add') {
		const userCredits = await config.supabaseClient
			.from("profiles")
			.select("credits")
			.eq("id", user_id)
			.single();

		creditsToUpdate = userCredits.data.credits + json.credits;
	}

	const result = await config.supabaseClient
		.from("profiles")
		.update({ credits: creditsToUpdate })
		.eq("id", user_id);

	if (result.error != undefined)
		return c.json({ error: "Invalid credits format" }, 500);

	return operation === 'set' ? 
		c.json({ message: "Credits updated successfully" }, 200) : 
		c.json({ message: "Credits granted successfully" }, 200);
}

export { updateLevel, updateCredits };
