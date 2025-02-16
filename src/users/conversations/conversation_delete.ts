import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../../config";
import AuthMiddleware from "../../middlewares/auth.ts";

const conversation_delete = new Hono();

conversation_delete.delete(
	"/:conv_id",
	describeRoute({
		summary: "Delete a conversation by ID",
		description:
			"Deletes a specific conversation for the authenticated user. Auth is required.",
		tags: ["users-conversations"],
		responses: {
			200: {
				description: "Success",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								message: {
									type: "string",
									example: "Conversation deleted successfully",
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

		const deletion = await config.supabaseClient
			.from("conversations")
			.delete()
			.eq("id", conversation.data.id);
		if (deletion.error != undefined)
			return c.json({ error: deletion.error.message }, 500);

		return c.json({ message: `Conversation deleted successfully` }, 200);
	},
);

export default conversation_delete;
