import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../../config.ts";
import AuthMiddleware from "../../middlewares/auth.ts";

const conversation_put = new Hono();

conversation_put.put("/:conv_id",
	describeRoute({
		summary: "Update a conversation by ID",
		description: "Updates an existing conversation for the authenticated user. Auth is required.",
		tags: ["users-conversations"],
		requestBody: {
			required: true,
			content: {
				"application/json": {
					schema: {
						type: "object",
						properties: {
							name: {
								type: "string",
								default: "Updated conversation name"
							}
						},
						required: ["name"]
					}
				}
			}
		},
		responses: {
			200: {
				description: "Successfully updated conversation",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								message: {
									type: "string",
									default: "Conversation updated successfully"
								}
							}
						}
					}
				}
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
									default: ["No authorization header found", "Invalid authorization header", "Invalid user"]
								}
							}
						}
					}
				}
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
									default: "Conversation not found"
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
									default: "Error message"
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
			if (!json || json.name == undefined)
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
		else if (conversation.error != undefined)
			return c.json({ error: conversation.error.message }, 500);

		const update = await config.supabaseClient
			.from("conversations")
			.update({ name: json.name })
			.eq("id", conversation.data.id);
		if (update.error != undefined)
			return c.json({ error: update.error.message }, 500);

		return c.json({ message: `Conversation updated successfully` }, 200);
	});

export default conversation_put;
