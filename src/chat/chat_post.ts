import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../config.ts";
import AuthMiddleware from "../middlewares/middleware_auth.ts";

const chat_post = new Hono();

chat_post.post("/conversations/:conv_id",
	describeRoute({
		summary: "Post a message to a conversation",
		description: "Posts a user message to a conversation, gets AI response, and updates conversation history",
		tags: ["chat"],
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
								default: "Hello"
							}
						},
						required: ["message"]
					}
				}
			}
		},
		responses: {
			200: {
				description: "Successfully processed message and got response",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								role: {
									type: "string",
									description: "The role of the responder",
									default: "assistant"
								},
								content: {
									type: "string",
									description: "The response content",
									default: "Hello user, how can I help you?"
								}
							},
							required: ["role", "content"]
						}
					}
				}
			},
			400: {
				description: "Invalid request",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								error: {
									type: "string",
									description: "The error message",
									default: "Invalid JSON"
								}
							},
							required: ["error"]
						}
					}
				}
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
									description: "The error message",
									default: [
										"No authorization header found",
										"Invalid authorization header",
									]
								}
							},
							required: ["error"]
						}
					}
				}
			},
			404: {
				description: "Conversation not found",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								error: {
									type: "string",
									description: "The error message (one of the possible errors)",
									default: ["Uid not found", "Conversation not found"]
								}
							},
							required: ["error"]
						}
					}
				}
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
									description: "The error message",
									default: "Internal server error"
								}
							},
							required: ["error"]
						}
					}
				}
			}
		}
	}),
	AuthMiddleware, async (c: any) => {
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

		const { data: convData, error: convError } = await config.supabaseClient
			.from("conversations")
			.select("*")
			.eq("user_id", user.uid)
			.eq("id", conv_id)
			.single();
		if (convData == undefined || convData.length == 0)
			return c.json({ error: "Conversation not found" }, 404);
		else if (convError) return c.json({ error: convError.message }, 500);

		// const prompt = 'You are a helpful chat assistant. You are given a chat history and a new user message. You need to generate a response to the user message based on the chat history. Try to keep the response short and concise. If the user message is not related to the chat history, respond with "I\'m sorry, I don\'t understand. Can you rephrase your question?"';
		var history = [];
		// history.push({ role: "system", content: prompt });
		if (convData.history != undefined)
			history.push(...convData.history);
		history.push({ role: "user", content: json.message });

		let response: any;
		try {
			response = await config.llm.chat({
				messages: JSON.parse(JSON.stringify(history))
			});
		} catch (error: any) {
			console.error("LLM Error:", error instanceof Error ? error.message : error);
			if (error.message?.toLowerCase().includes("rate_limit_exceeded")) {
				console.log("Hit rate limit. Consider implementing retry logic.");
				return c.json({ error: "Rate limit exceeded" }, 500);
			}
			return c.json({ error: "Failed to process message" }, 500);
		}

		history.push({ role: "assistant", content: response.message.content });
		// history.shift();

		const { data: updateData, error: updateError } = await config.supabaseClient
			.from("conversations")
			.update({ history: history })
			.eq("id", convData.id);
		if (updateError) return c.json({ error: updateError.message }, 500);
		return c.json({ role: "assistant", content: response.message.content }, 200);
	});

export default chat_post;
