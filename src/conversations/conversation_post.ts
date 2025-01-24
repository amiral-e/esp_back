import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../config.ts";
import AuthMiddleware from "../middlewares/middleware_auth.ts";

const conversation_post = new Hono();

conversation_post.post(
	"/",
	describeRoute({
		summary: 'Create a conversation',
		description: 'This route creates a conversation',
		tags: ['conversations'],
		requestBody: {
			content: {
				'application/json': {
					schema: {
						type: 'object',
						properties: {
							name: {
								type: 'string',
								default: 'name',
								description: 'The name of the conversation',
							}
						},
					},
				},
			},
		},
		responses: {
			200: {
				description: 'OK',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								message: {
									type: 'string',
									default: 'Conversation name created successfully',
									description: 'The message indicating that the conversation was created successfully',
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
			400: {
				description: 'Bad request',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								error: {
									type: 'string',
									default: 'Invalid JSON',
									description: 'The error message',
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
