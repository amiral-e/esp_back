import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../config";
import AuthMiddleware from "../middlewares/middleware_auth.ts";

const conversation_delete = new Hono();

conversation_delete.delete("/:conv_id",
	describeRoute({
		summary: "Delete a conversation by ID",
		description: "Deletes a specific conversation for the authenticated user. Auth is required.",
		tags: ["conversations"],
		responses: {
			200: {
				description: "Successfully deleted conversation",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								message: {
									type: "string",
									description: "Success message",
									example: "Conversation 123 deleted successfully"
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

		const { data: deletedConv, error: deleteError } = await config.supabaseClient
			.from("conversations")
			.delete()
			.eq("id", convData.id);
		if (deleteError != undefined)
			return c.json({ error: deleteError.message }, 500);
		return c.json(
			{ message: `Conversation ${conv_id} deleted successfully` },
			200,
		);
	});

export default conversation_delete;
