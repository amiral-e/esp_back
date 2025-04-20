import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import AuthMiddleware from "../../middlewares/auth.ts";
import get_conversation from "./conversation_get.ts";

const conversation_get = new Hono();

conversation_get.get(
	"/:conv_id",
	describeRoute({
		summary: "Get a single conversation by ID",
		description:
			"Returns the details of a single conversation for the authenticated user. Auth is required.",
		tags: ["users-conversations"],
		responses: {
			200: {
				description: "Successfully retrieved conversation",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								name: {
									type: "string",
									description: "The name of the conversation",
									default: "My conversation",
								},
								history: {
									type: "array",
									items: {
										type: "object",
										properties: {
											message: {
												type: "string",
												description: "The message content",
												default: "Hello, how are you?",
											},
											role: {
												type: "string",
												description:
													"The role of the user who sent the message",
												default: "user",
											},
										},
										required: ["message", "role"],
									},
								},
								id: {
									type: "string",
									description: "The conversation ID",
									default: "123",
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
									default: "Conversation not found",
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
		return await get_conversation(c);
	},
);

export default conversation_get;
