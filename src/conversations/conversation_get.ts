import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../config.ts";
import AuthMiddleware from "../middlewares/middleware_auth.ts";

const conversation_get = new Hono();

conversation_get.get("/:conv_id",
	describeRoute({
		summary: "Get a single conversation by ID",
		description: "Returns the details of a single conversation for the authenticated user. Auth is required.",
		tags: ["conversations"],
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
									example: "My conversation"
								},
								history: {
									type: "array",
									items: {
										type: "object",
										properties: {
											message: {
												type: "string",
												description: "The message content",
												example: "Hello, how are you?"
											},
											role: {
												type: "string",
												description: "The role of the user who sent the message",
												example: "user"
											},
										},
										required: ["message", "role"]
									}
								},
								id: {
									type: "string",
									description: "The conversation ID",
									example: "123"
								}
							}
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
									default: ["No authorization header found", "Invalid authorization header"]
								}
							}
						}
					}
				}
			},
			404: {
				description: "Not Found",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								error: {
									type: "string",
									description: "The error message (one of the possible errors)",
									default: ["Uid not found", "Conversation not found"],
								},
							}
						}
					}
				}
			},
			500: {
				description: "Internal Server Error",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								error: {
									type: "string",
									description: "The error message",
									example: "Internal server error"
								}
							}
						}
					}
				}
			}
		}
	}),
	AuthMiddleware, async (c: any) => {
		const user = c.get("user");
		const { conv_id } = c.req.param();

		const { data, error } = await config.supabaseClient
			.from("conversations")
			.select("*")
			.eq("user_id", user.uid)
			.eq("id", conv_id)
			.single();
		if (data == undefined || data.length == 0)
			return c.json({ error: "Conversation not found" }, 404);
		else if (error != undefined) return c.json({ error: error.message }, 500);
		return c.json({ name: data.name, history: data.history, id: data.id }, 200);
	});

export default conversation_get;
