import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../config.ts";
import AuthMiddleware from "../middlewares/middleware_auth.ts";

const chat_post = new Hono();

chat_post.post(
	"/conversations/:conv_id",
	describeRoute({
		summary: "Send a message to assistant",
		description: "Send a message to assistant",
		tags: ["chat"],
		parameters: [
			{
				name: "conv_id",
				in: "path",
				required: true,
				schema: {
					type: "string",
				},
			}
		],
		requestBody: {
			content: {
				"application/json": {
					schema: {
						type: "object",
						properties: {
							message: {
								type: "string",
								default: "Hello world",
								description: "Message to send to assistant",
							},
						},
						required: ["message"],
					},
				},
			},
			required: true,
		},
		responses: {
			200: {
				description: "Message sent to assistant",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								role: {
									type: "string",
									default: "assistant",
									description: "Role of the message",
								},
								content: {
									type: "string",
									default: "Response from the assistant",
									description: "Content of the message",
								},
							},
							required: ["role", "content"],
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
		if (!json || json.message == undefined)
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
	else if (convError) return c.json({ error: convError.message }, 500);

	var history = convData.history;
	history.push({ role: "user", content: json.message });

	let response: any;
	try {
		response = await fetch(`${config.envVars.IA_URL}/chat`, {
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
	return c.json({ role: "assistant", content: body.content }, 200);
});

export default chat_post;
