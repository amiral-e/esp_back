import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import AuthMiddleware from "../../middlewares/auth.ts";
import post_chat from "./chat_post.ts";

const chat_post = new Hono();

chat_post.post(
	"/:conv_id",
	describeRoute({
		summary: "Post a message to a conversation",
		description:
			"Posts a user message to a conversation, gets AI response, and updates conversation history. Auth is required.",
		tags: ["users-chat"],
		requestBody: {
			required: true,
			content: {
				"application/json": {
					schema: {
						type: "object",
						properties: {
							message: {
								type: "string",
								description: "The message to be sent in the conversation",
								default: "Hello",
							},
						},
						required: ["message"],
					},
				},
			},
		},
		responses: {
			200: {
				description: "Sucess",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								role: {
									type: "string",
									description: "The role of the responder",
									default: "assistant",
								},
								content: {
									type: "string",
									description: "The response content",
									default: "Hello user, how can I help you?",
								},
							},
							required: ["role", "content"],
						},
					},
				},
			},
			400: {
				description: "Bad request",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								error: {
									type: "string",
									default: ["Invalid JSON", "Invalid collection name"],
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
			402: {
				description: "Payment Required",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								error: {
									type: "string",
									default: "Not enough credits",
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
		return await post_chat(c);	
	},
);

export default chat_post;
