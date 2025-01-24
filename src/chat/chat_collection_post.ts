import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../config.ts";
import AuthMiddleware from "../middlewares/middleware_auth.ts";

const chat_collection_post = new Hono();

chat_collection_post.post(
	"/conversations/:conv_id/collections/:collec_name",
	describeRoute({
		summary: 'Chat with a collection',
		description: 'This route chats with a collection',
		tags: ['chat'],
		parameters: [
			{
				in: 'path',
				name: 'conv_id',
				description: 'The id of the conversation',
				required: true,
				schema: {
					type: 'string'
				},
			},
			{
				in: 'path',
				name: 'collec_name',
				description: 'The name of the collection',
				required: true,
				schema: {
					type: 'string'
				},
			}
		],
		requestBody: {
			content: {
				'application/json': {
					schema: {
						type: 'object',
						properties: {
							message: {
								type: 'string',
								default: 'Hello world',
								description: 'The message to send',
							},
						},
					},
				},
			},
			required: true,
		},
		responses: {
			200: {
				description: 'OK',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								role: {
									type: 'string',
									default: 'assistant',
									description: 'The role of the message',
								},
								content: {
									type: 'string',
									default: 'Response from the assistant',
									description: 'The content of the message',
								},
								sources: {
									type: 'array',
									items: {
										type: 'object',
										properties: {
											uid: {
												type: 'string',
												default: 'global',
												description: 'The unique identifier of the source'
											},
											filename: {
												type: 'string',
												default: '',
												description: 'The filename of the source'
											}
										}
									},
									default: [
										{
											uid: 'uid',
											filename: 'paul_graham_essay.txt'
										}
									],
									description: 'The sources of the message'
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
									default: ['Uid not found', 'Conversation not found', 'Collection not found'],
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
	AuthMiddleware,
	async (c: any) => {
		const user = c.get("user");
		let json: any;
		try {
			json = await c.req.json();
			if (!json || json.message == undefined)
				return c.json({ error: "Invalid JSON" }, 400);
		} catch (error) {
			return c.json({ error: "Invalid JSON" }, 400);
		}
		const { conv_id, collec_name } = c.req.param();
		if (
			!collec_name.startsWith("global_") &&
			!collec_name.startsWith(user.uid + "_")
		)
			return c.json({ error: "Invalid collection name" }, 400);

		const { data: collectionData, error: collectionError } =
			await config.supabaseClient
				.schema("vecs")
				.rpc("get_vecs", { name: collec_name });
		if (collectionData == undefined || collectionData.length == 0)
			return c.json({ error: "Collection not found" }, 404);
		else if (collectionError != undefined)
			return c.json({ error: collectionError.message }, 500);

		const { data: convData, error: convError } = await config.supabaseClient
			.from("conversations")
			.select("*")
			.eq("user_id", user.uid)
			.eq("id", conv_id)
			.single();
		if (convData == undefined || convData.length == 0)
			return c.json({ error: "Conversation not found" }, 404);
		else if (convError) return c.json({ error: convError.message }, 500);

		var history = convData.history;
		history.push({ role: "user", content: json.message });

		let response: any;
		try {
			response = await fetch(`${config.envVars.IA_URL}/chat/${collec_name}`, {
				method: "POST",
				body: JSON.stringify(history),
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${config.envVars.BEARER_TOKEN}`,
				},
			});
		} catch (error: any) {
			if (error instanceof Error) {
				console.error("Fetch failed with error:", error.message);
				return c.json({ error: error.message }, 500);
			} else {
				console.error("Fetch failed with unknown error:", error);
				return c.json({ error: "Unknown error" }, 500);
			}
		}
		if (response.status != 200)
			return c.json({ error: "Error while fetching response from AI" }, 500);

		const body = await response.json();
		history.push({ role: "assistant", content: body.content });

		const { data: updateData, error: updateError } = await config.supabaseClient
			.from("conversations")
			.update({ history: history })
			.eq("id", convData.id);
		if (updateError) return c.json({ error: updateError.message }, 500);
		return c.json(
			{ role: "assistant", content: body.content, sources: body.sources },
			200,
		);
	},
);

export default chat_collection_post;
