import config from "../config.ts";

import { sign } from "hono/jwt";

/**
 * Retrieves user data from the database.
 * 
 * @param uid The user's unique ID.
 * @returns A promise that resolves to an object containing the user's validity and admin status.
 */
async function getUser(uid: string) {
	const is_valid = await config.supabaseClient.rpc("is_valid_uid", {
		user_id: uid,
	});
	if (is_valid.error) is_valid.data = false;

	const is_admin = await config.supabaseClient.rpc("is_admin_uid", {
		user_id: uid,
	});
	if (is_admin.error) is_admin.data = false;

	return {
		valid: is_valid.data,
		admin: is_admin.data,
	};
}

/**
 * Generates a JSON Web Token (JWT) payload for the given user ID.
 * 
 * @param id The user's unique ID.
 * @returns A promise that resolves to the generated JWT token.
 */
async function generatePayload(id: string) {
	const token = await sign({ uid: id }, config.envVars.JWT_SECRET);
	return token;
}

export { getUser, generatePayload };
