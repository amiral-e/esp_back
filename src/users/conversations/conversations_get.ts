import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../../config";
import AuthMiddleware from "../../middlewares/middleware_auth.ts";

const conversations_get = new Hono();

conversations_get.get(
	describeRoute({
		summary: "Get all conversations",
		description: "Returns all conversations for the authenticated user. Auth is required.",
		tags: ["users-conversations"],
		responses: {
			200: {
				description: "Successfully retrieved conversations",
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
												example: "123"
											},
											user_id: {
												type: "string",
												description: "The user ID of the conversation",
												example: "123"
											},
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
											created_at: {
												type: "string",
												description: "The timestamp when the conversation was created",
												example: "2023-03-01T12:00:00.000Z"
											},
										},
									}
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
									default: ["Uid not found", "No conversations found"],
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
									example: "Internal server error",
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

		const { data, error } = await config.supabaseClient
			.from("conversations")
			.select("*")
			.eq("user_id", user.uid);
		if (data == undefined || data.length == 0)
			return c.json({ error: "No conversations found" }, 404);
		else if (error != undefined) return c.json({ error: error.message }, 500);
		return c.json({ conversations: data }, 200);
	});

export default conversations_get;
