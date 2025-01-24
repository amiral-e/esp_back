import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../config.ts";
import AuthMiddleware from "../middlewares/middleware_auth.ts";

const conversation_get = new Hono();

conversation_get.get(
	"/:conv_id",
	describeRoute({
		summary: 'Get a conversation',
		description: 'This route returns a conversation',
		tags: ['conversations'],
		parameters: [
			{
				name: 'conv_id',
				in: 'path',
				required: true,
				description: 'The ID of the conversation to get',
				schema: {
					type: 'string',
				},
			},
		],
		responses: {
			200: {
				description: 'OK',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								id: {
									type: 'string',
									default: 'id',
									description: 'The ID of the conversation',
								},
								name: {
									type: 'string',
									default: 'name',
									description: 'The name of the conversation',
								},
								history: {
									type: 'array',
									items: {
										type: 'object',
										properties: {
											role: {
												type: 'string',
												default: 'user',
												description: 'The role of the user in the conversation',
											},
											content: {
												type: 'string',
												default: 'Hello world',
												description: 'The content of the message',
											},
										},
									},
									description: 'The history of the conversation',
								},
							},
						},
					},
				},
			},
			401: {
				description: 'Unauthorized',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								error: {
									type: 'string',
									default: ['No authorization header found', 'Invalid authorization header'],
									description: 'The error message (one of the possible errors)',
								},
							},
						},
					},
				},
			},
			404: {
				description: 'Not found',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								error: {
									type: 'string',
									default: ['Uid not found', 'Conversation not found'],
									description: 'The error message (one of the possible errors)',
								},
							},
						},
					},
				},
			},
			500: {
				description: 'Internal server error',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								error: {
									type: 'string',
									default: 'Internal server error',
									description: 'The error message',
								},
							},
						},
					},
				},
			},
		},
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
