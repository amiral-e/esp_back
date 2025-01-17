import { decode, sign, verify } from "hono/jwt";
import config from "./config.ts";

const AuthMiddleware = async (c: any, next: any) => {
	const { authorization } = c.req.header();
	if (!authorization)
		return c.json({ error: "No authorization header found" }, 401);
	const bearer = authorization.replace("Bearer ", "");
	try {
		const decoded = await verify(bearer, config.envVars.JWT_SECRET);
		if (!decoded || !decoded["uid"])
			return c.json({ error: "Invalid authorization header" }, 401);
		const { data, error } = await config.supabaseClient.rpc(
			"check_uid_exists",
			{ uid: decoded["uid"] },
		);
		if (error) return c.json({ error: error.message }, 500);
		c.set("user", decoded);
		return next();
	} catch (error) {
		return c.json({ error: "Invalid authorization header" }, 401);
	}
};

const AdminMiddleware = async (c: any, next: any) => {
	const { authorization } = c.req.header();
	if (!authorization)
		return c.json({ error: "No authorization header found" }, 401);
	const bearer = authorization.replace("Bearer ", "");
	try {
		const decoded = await verify(bearer, config.envVars.JWT_SECRET);
		if (!decoded || !decoded["uid"])
			return c.json({ error: "Invalid authorization header" }, 401);
		const { data, error } = await config.supabaseClient.rpc(
			"check_uid_exists",
			{ uid: decoded["uid"] },
		);
		if (error) return c.json({ error: error.message }, 500);

		const { data: adminsData, error: adminsError } = await config.supabaseClient
			.from("admins")
			.select("*");
		if (
			adminsData == undefined ||
			adminsError != undefined ||
			adminsData.length == 0 ||
			adminsData.find((admin: any) => admin.user_id == decoded["uid"]) ==
				undefined
		)
			return c.json({ error: "You don't have admin privileges" }, 401);

		c.set("user", decoded);
		return next();
	} catch (error) {
		return c.json({ error: "Invalid authorization header" }, 401);
	}
};

export default AuthMiddleware;
