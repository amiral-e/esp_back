import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../config";
import AuthMiddleware from "../middlewares/middleware_auth.ts";

const conversations_get = new Hono();

conversations_get.get(
	describeRoute({
		summary: 'Get all conversations',
		description: 'This route returns all conversations',
		tags: ['conversations'],
		responses: {
			200: {
				description: 'OK',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								conversations: {
									type: 'array',
									items: {
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
									default: ['Uid not found', 'No conversations found'],
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
