import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../config.ts";
import AuthMiddleware from "../middlewares/middleware_auth.ts";

const conversation_put = new Hono();

conversation_put.put(
	"/:conv_id",
	describeRoute({
		summary: 'Update a conversation',
		description: 'This route updates a conversation',
		tags: ['conversations'],
		parameters: [
			{
				name: 'conv_id',
				in: 'path',
				required: true,
				description: 'The ID of the conversation to update',
				schema: {
					type: 'string',
				},
			},
		],
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
									default: 'Conversation id updated successfully',
									description: 'The message indicating that the conversation was updated successfully',
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
