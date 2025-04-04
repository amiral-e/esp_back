import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../../config.ts";
import AuthMiddleware from "../../middlewares/auth.ts";

const prompts_get = new Hono();

prompts_get.get(
	describeRoute({
		summary: "Get Platform's Prompts",
		description:
			"Retrieve platform's prompts from the database. Auth is required.",
		tags: ["admins-config"],
		responses: {
			200: {
				description: "Success",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								prompts: {
									type: "array",
									items: {
										type: "object",
										properties: {
											id: {
												type: "string",
												default: "123",
											},
											type: {
												type: "string",
												default: "beginner",
											},
											prompt: {
												type: "string",
												default: "This is a system prompt"
											}
										},
									},
								},
							},
							required: ["prompts"],
						},
					},
				},
			},
			401: {
				description: "Unauthorized",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								error: {
									type: "string",
									default: [
										"No authorization header found",
										"Invalid authorization header",
										"Invalid user",
									],
								},
							},
						},
					},
				},
			},
			404: {
				description: "Not found",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								error: {
									type: "string",
									default: "No level found",
								},
							},
						},
					},
				},
			},
			500: {
				description: "Internal server error",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								error: {
									type: "string",
									default: "Error message",
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
		const user = c.get("user");

		const prompts = await config.supabaseClient
			.from("prompts")
			.select("type, prompt");
		if (prompts.data == undefined || prompts.data.length == 0)
			return c.json({ error: "No level found" }, 404);
		else if (prompts.error != undefined)
			return c.json({ error: prompts.error.message }, 500);

		return c.json({ prompts: prompts.data }, 200);
	},
);

export default prompts_get;
