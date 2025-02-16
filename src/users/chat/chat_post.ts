import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../../config.ts";
import AuthMiddleware from "../../middlewares/auth.ts";

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
							required: ["error"],
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
							required: ["error"],
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
							required: ["error"],
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
		let json: any;

		try {
			json = await c.req.json();
			if (!json || json.message == undefined)
				return c.json({ error: "Invalid JSON" }, 400);
		} catch (error) {
			return c.json({ error: "Invalid JSON" }, 400);
		}
		const { conv_id } = c.req.param();

		const conversation = await config.supabaseClient
			.from("conversations")
			.select("*")
			.eq("user_id", user.uid)
			.eq("id", conv_id)
			.single();
		if (conversation.data == undefined || conversation.data.length == 0)
			return c.json({ error: "Conversation not found" }, 404);
		else if (conversation.error)
			return c.json({ error: conversation.error.message }, 500);

		var history = [];
		if (conversation.data.history != undefined)
			history.push(...conversation.data.history);
		history.push({ role: "user", content: json.message });

		let response: any;
		try {
			response = await config.llm.chat({
				messages: JSON.parse(JSON.stringify(history)),
			});
		} catch (error: any) {
			console.error(
				"LLM Error:",
				error instanceof Error ? error.message : error,
			);
			if (error.message?.toLowerCase().includes("rate_limit_exceeded")) {
				console.log("Hit rate limit. Consider implementing retry logic.");
				return c.json({ error: "Rate limit exceeded" }, 500);
			}
			return c.json({ error: "Failed to process message" }, 500);
		}

		history.push({ role: "assistant", content: response.message.content });

		const update = await config.supabaseClient
			.from("conversations")
			.update({ history: history })
			.eq("id", conversation.data.id);
		if (update.error) return c.json({ error: update.error.message }, 500);

		return c.json(
			{ role: "assistant", content: response.message.content },
			200,
		);
	},
);

export default chat_post;
