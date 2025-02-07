import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../config.ts";
import AuthMiddleware from "../middlewares/middleware_auth.ts";

const conversation_post = new Hono();

conversation_post.post("/",
	describeRoute({
		summary: "Create a new conversation",
		description: "Creates a new conversation for the authenticated user. Auth is required.",
		tags: ["conversations"],
		requestBody: {
			required: true,
			content: {
				"application/json": {
					schema: {
						type: "object",
						properties: {
							name: {
								type: "string",
								description: "The name of the conversation",
								example: "My conversation"
							}
						},
						required: ["name"]
					}
				}
			}
		},
		responses: {
			200: {
				description: "Successfully created conversation",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								message: {
									type: "string",
									description: "Success message",
									example: "Conversation Test created successfully with id 123"
								}
							}
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

		let json: any;
		try {
			json = await c.req.json();
			if (!json || json.name == undefined || json.description == undefined)
				return c.json({ error: "Invalid JSON" }, 400);
		} catch (error) {
			return c.json({ error: "Invalid JSON" }, 400);
		}

		const { data, error } = await config.supabaseClient
			.from("conversations")
			.insert({ history: [], name: json.name, user_id: user.uid })
			.select("*")
			.single();
		if (data == undefined || error != undefined)
			return c.json({ error: error.message }, 500);
		return c.json(
			{
				message: `Conversation ${json.name} created successfully with id ${data.id}`,
			},
			200,
		);
	});

export default conversation_post;
