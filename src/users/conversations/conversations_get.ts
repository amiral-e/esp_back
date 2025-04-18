import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../../config";
import AuthMiddleware from "../../middlewares/auth.ts";

const conversations_get = new Hono();

conversations_get.get(
	describeRoute({
		summary: "Get all conversations",
		description:
			"Returns all conversations for the authenticated user. Auth is required.",
		tags: ["users-conversations"],
		responses: {
			200: {
				description: "Success",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								conversations: {
									type: "array",
									items: {
										type: "object",
										properties: {
											id: {
												type: "string",
												description: "The conversation ID",
												example: "123",
											},
											user_id: {
												type: "string",
												description: "The user ID of the conversation",
												example: "123",
											},
											name: {
												type: "string",
												description: "The name of the conversation",
												example: "My conversation",
											},
											history: {
												type: "array",
												items: {
													type: "object",
													properties: {
														message: {
															type: "string",
															description: "The message content",
															example: "Hello, how are you?",
														},
														role: {
															type: "string",
															description:
																"The role of the user who sent the message",
															example: "user",
														},
													},
													required: ["message", "role"],
												},
											},
											created_at: {
												type: "string",
												description:
													"The timestamp when the conversation was created",
												example: "2023-03-01T12:00:00.000Z",
											},
										},
									},
								},
							},
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
									default: "No conversation found",
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
		return await get_conversations(c);
	},
);

async function get_conversations(c: any) {
	const user = c.get("user");

	const conversations = await config.supabaseClient
		.from("conversations")
		.select("*")
		.eq("user_id", user.uid);
	if (conversations.data == undefined || conversations.data.length == 0)
		return c.json({ error: "No conversations found" }, 404);

	return c.json({ conversations: conversations.data }, 200);
}

export default conversations_get;
