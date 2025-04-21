import config from "../config.ts";
import { sign } from "hono/jwt";

/**
 * Generates a JWT token for a given user ID.
 * 
 * @param {any} c - The request context.
 * @returns {Promise<any>} A JSON response containing the generated JWT token.
 */
async function generate_user_jwt(c: any) {
	let json: any;
	try {
		json = await c.req.json();
		if (json?.uid == undefined) return c.json({ error: "Invalid JSON" }, 400);
	} catch (error) {
		return c.json({ error: "Invalid JSON" }, 400);
	}

	const token = await sign({ uid: json.uid }, config.envVars.JWT_SECRET);
	return c.json({
		message: "Here is your JWT",
		token: token,
	});
}

export default generate_user_jwt;
