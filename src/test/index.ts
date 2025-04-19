import { Hono } from "hono";

import user_get from "./user_get_def.ts";
import user_jwt_gen from "./user_jwt_gen_def.ts";
import { describeRoute } from "hono-openapi";

import AuthMiddleware from "../middlewares/auth.ts";

const test = new Hono();

test.route("/", user_get);
test.route("/", user_jwt_gen);

test.get(
	"/check_uid",
	describeRoute({
		summary: "Check UID",
		description: "Check the UID of the user",
		tags: ["debug"],
		responses: {
			"200": { description: "Success" },
			"401": { description: "Unauthorized" },
		},
	}),
	AuthMiddleware,
	async (c: any) => {
		return await get_user(c);
	},
);

async function get_user(c: any) {
	const user = c.get("user");
	return c.json({ user: user });
}

export default test;
