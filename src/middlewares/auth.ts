import { verify } from "hono/jwt";
import config from "../config.ts";
import { getUser } from "./utils.ts";



const AuthMiddleware = async (c: any, next: any) => {
	const { authorization } = c.req.header();
	if (!authorization)
		return c.json({ error: "No authorization header found" }, 401);

	const bearer = authorization.replace("Bearer ", "");
	let uid = "";

	try {
		const decoded = await verify(bearer, config.envVars.JWT_SECRET);
		if (!decoded || !decoded["uid"] || typeof decoded["uid"] !== "string")
			return c.json({ error: "Invalid authorization header" }, 401);
		uid = decoded["uid"];
	} catch (error) {
		return c.json({ error: "Invalid authorization header" }, 401);
	}
	const user = await getUser(uid);
	if (!user.valid) return c.json({ error: "Invalid user" }, 401);

	c.set("user", {
		uid: uid,
		admin: user.admin,
	});
	return next();
};

export default AuthMiddleware;
