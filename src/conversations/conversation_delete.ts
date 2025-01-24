import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../config";
import AuthMiddleware from "../middlewares/middleware_auth.ts";

const conversation_delete = new Hono();

conversation_delete.delete(
	"/:conv_id",
	describeRoute({
		summary: 'Delete a conversation',
		description: 'This route deletes a conversation',
		tags: ['conversations'],
		parameters: [
			{
				name: 'conv_id',
				in: 'path',
				required: true,
				description: 'The ID of the conversation to delete',
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
								message: {
									type: 'string',
									default: 'Conversation uid deleted successfully',
									description: 'The message indicating that the conversation was deleted successfully',
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
