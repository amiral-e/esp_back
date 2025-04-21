import config from "../config.ts";
import { sign } from "hono/jwt";

/**
 * Generates a JWT token for a given user ID.
 * 
 * @param {any} c - The request context.
 * @returns {Promise<any>} A JSON response containing the generated JWT token.
 */
async function generate_user_jwt(c: any) {
	// Attempt to parse the JSON from the request body
	let json: any;
	try {
		json = await c.req.json();
		// Check if the 'uid' property is present in the JSON object
		if (json?.uid == undefined) return c.json({ error: "Invalid JSON" }, 400);
	} catch (error) {
		// If JSON parsing fails, return an error response
		return c.json({ error: "Invalid JSON" }, 400);
	}

	// Generate a JWT token using the 'uid' from the JSON and the JWT secret
	const token = await sign({ uid: json.uid }, config.envVars.JWT_SECRET);
	// Return a JSON response containing the generated JWT token
	return c.json({
		message: "Here is your JWT",
		token: token,
	});
}

export default generate_user_jwt;