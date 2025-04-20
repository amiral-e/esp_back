import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import generate_user_jwt from "./user_jwt_gen";

const user_jwt_gen = new Hono();

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

export default user_jwt_gen;
