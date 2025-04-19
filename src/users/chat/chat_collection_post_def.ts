import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import AuthMiddleware from "../../middlewares/auth.ts";
import post_chat_with_collection from "./chat_collection_post.ts";

const chat_collection_post = new Hono();

chat_collection_post.post(
	"/:conv_id/collections",
	describeRoute({
		summary: "Post a message to a collection conversation",
		description:
			"Posts a user message to a conversation using the context from one or more collections. It gets AI's response, and updates conversation history. Auth is required.",
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
							collections: {
								type: "array",
								items: {
									type: "string",
									description: "The ids of collections to use as context",
									default: "global_test",
								},
							},
						},
						required: ["message"],
					},
				},
			},
		},
		responses: {
			200: {
				description: "Success",
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
								sources: {
									type: "array",
									description: "Sources used for the response",
									items: {
										type: "object",
										properties: {
											collection: {
												type: "string",
												description: "Collection used to retrieve documents",
												default: "global_test",
											},
											documents: {
												type: "array",
												description:
													"List of documents retrieved from the collection",
												items: {
													type: "string",
													default: "test.txt",
												},
											},
										},
									},
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
									default: ["Collection not found", "Conversation not found"],
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
	async (c) => {
		return await post_chat_with_collection(c);
	},
);

export default chat_collection_post;
