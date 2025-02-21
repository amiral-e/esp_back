import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../../config.ts";
import AuthMiddleware from "../../middlewares/auth.ts";

const conversation_post = new Hono();

conversation_post.post(
	describeRoute({
		summary: "Create a new conversation",
		description:
			"Creates a new conversation for the authenticated user. Auth is required.",
		tags: ["users-conversations"],
		requestBody: {
			required: true,
			content: {
				"application/json": {
					schema: {
						type: "object",
						properties: {
							name: {
								type: "string",
								description: "The name of the conversation",
								example: "My conversation",
							},
						},
						required: ["name"],
					},
				},
			},
		},
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
									example: "Conversation test created successfully with id 123",
								},
							},
						},
					},
				},
			},
			400: {
				description: "Bad request",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								error: {
									type: "string",
									default: "Invalid JSON",
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
									description: "The error message",
									default: [
										"No authorization header found",
										"Invalid authorization header",
										"Invalid user",
									],
								},
							},
						},
					},
				},
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

		let json: any;
		try {
			json = await c.req.json();
			if (!json || json.name == undefined)
				return c.json({ error: "Invalid JSON" }, 400);
		} catch (error) {
			return c.json({ error: "Invalid JSON" }, 400);
		}

		const creation = await config.supabaseClient
			.from("conversations")
			.insert({ history: [], name: json.name, user_id: user.uid })
			.select("*")
			.single();
		if (creation.data == undefined || creation.error != undefined)
			return c.json({ error: creation.error.message }, 500);

		return c.json(
			{
				message: `Conversation ${json.name} created successfully with id ${creation.data.id}`,
			},
			200,
		);
	},
);

export default conversation_post;
