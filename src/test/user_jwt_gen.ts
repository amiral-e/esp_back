import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../config.ts";

const user_jwt_gen = new Hono();

import { sign } from "hono/jwt";

user_jwt_gen.post(
	describeRoute({
		summary: "Generate user's JWT",
		description:
			"This is a test route, it generates a JWT from a given uid. Auth is not required.",
		tags: ["debug"],
		requestBody: {
			content: {
				"application/json": {
					schema: {
						type: "object",
						properties: {
							uid: {
								type: "string",
								description: "The user uid",
							},
						},
						required: ["uid"],
					},
				},
			},
			required: true,
		},
		responses: {
			200: {
				description: "OK",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								message: {
									type: "string",
									description: "The message",
								},
								token: {
									type: "string",
									description: "The JWT token",
								},
							},
						},
					},
				},
			},
		},
	}),
	async (c: any) => {
		return await generate_user_jwt(c);
	},
);

async function generate_user_jwt(c: any) {
	let json: any;
	try {
		json = await c.req.json();
		if (json?.uid == undefined)
			return c.json({ error: "Invalid JSON" }, 400);
	} catch (error) {
		return c.json({ error: "Invalid JSON" }, 400);
	}

	const token = await sign({ uid: json.uid }, config.envVars.JWT_SECRET);
	return c.json({
		message: "Here is your JWT",
		token: token,
	});
}

export default user_jwt_gen;
