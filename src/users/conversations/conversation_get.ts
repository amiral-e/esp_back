import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../../config.ts";
import AuthMiddleware from "../../middlewares/auth.ts";

const conversation_get = new Hono();

conversation_get.get(
	"/:conv_id",
	describeRoute({
		summary: "Get a single conversation by ID",
		description:
			"Returns the details of a single conversation for the authenticated user. Auth is required.",
		tags: ["users-conversations"],
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
									default: "My conversation",
								},
								history: {
									type: "array",
									items: {
										type: "object",
										properties: {
											message: {
												type: "string",
												description: "The message content",
												default: "Hello, how are you?",
											},
											role: {
												type: "string",
												description:
													"The role of the user who sent the message",
												default: "user",
											},
										},
										required: ["message", "role"],
									},
								},
								id: {
									type: "string",
									description: "The conversation ID",
									default: "123",
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

		return c.json(
			{
				name: conversation.data.name,
				history: conversation.data.history,
				id: conversation.data.id,
			},
			200,
		);
	},
);

export default conversation_get;
