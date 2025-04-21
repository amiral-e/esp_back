import { updateLevel } from "../../admins/profile/utils.ts";

/**
 * Updates the level of a user.
 * 
 * @param c The context object containing the user information.
 * @returns A promise resolving with the updated level.
 */
async function put_level(c: any) {
	const user = c.get("user");

	return await updateLevel(c, user.uid);	
}

export default put_level;
