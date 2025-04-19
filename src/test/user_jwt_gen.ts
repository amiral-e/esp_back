import config from "../config.ts";
import { sign } from "hono/jwt";

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
