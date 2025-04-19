import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import AuthMiddleware from "../middlewares/auth.ts";
import get_user from "./user_get.ts";

const user_get = new Hono();

user_get.get(
	describeRoute({
		summary: "Get connected user",
		description:
			"This is a test route, it returns the connected user's uid. Auth is required.",
		tags: ["debug"],
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
								user: {
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
					},
				},
			},
		},
	}),
	AuthMiddleware,
	async (c: any) => {
		return await get_user(c);
	},
);

export default user_get;
