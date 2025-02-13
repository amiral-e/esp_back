import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../../config.ts";
import AuthMiddleware from "../../middlewares/middleware_auth.ts";

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
								description: "The new name of the conversation",
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
									description: "Success message",
									default: "Conversation 123 updated successfully"
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
			404: {
				description: "Resource not found",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								error: {
									type: "string",
									description: "The error message",
									default: ["Uid not found", "Conversation not found"]
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
			if (!json || json.name == undefined)
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
		else if (convError != undefined)
			return c.json({ error: convError.message }, 500);

		const { data: updateData, error: updateError } = await config.supabaseClient
			.from("conversations")
			.update({ name: json.name })
			.eq("id", convData.id);
		if (updateError != undefined)
			return c.json({ error: updateError.message }, 500);
		return c.json(
			{ message: `Conversation ${convData.id} updated successfully` },
			200,
		);
	});

export default conversation_put;
