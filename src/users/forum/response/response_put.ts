import config from "../../../config.ts";
import AuthMiddleware from "../../../middlewares/auth.ts";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

const response_put = new Hono();

response_put.put(
	"/:id",
	describeRoute({
		summary: "Update a response",
		description:
			"Update a response by ID. Users can update their own responses. Administrators can update any response.",
		tags: ["users-forum-responses"],
		parameters: [
			{
				name: "id",
				in: "path",
				description: "Response ID",
				required: true,
				schema: {
					type: "string",
				},
			},
		],
		requestBody: {
			content: {
				"application/json": {
					schema: {
						type: "object",
						properties: {
							message: {
								type: "string",
								description: "The response message",
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
				description: "OK",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								id: {
									type: "number",
									description: "The response ID",
								},
								message: {
									type: "string",
									description: "The updated message",
								},
								user_id: {
									type: "string",
									description: "The user ID",
								},
							},
						},
					},
				},
			},
			403: {
				description: "Forbidden",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								error: {
									type: "string",
									default: "Not authorized to update this response",
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
									default: "Invalid JSON body",
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
						},
					},
				},
			},
			404: {
				description: "Not Found",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								error: {
									type: "string",
									default: "Response not found",
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
		const id = c.req.param("id");
		let body: any;

		try {
			body = await c.req.json();
			if (!body?.message?.trim()) {
				return c.json({ error: "Invalid JSON body" }, 400);
			}
		} catch (error) {
			return c.json({ error: "Invalid JSON body" }, 400);
		}

		const response = await config.supabaseClient
			.from("responses")
			.select("*")
			.eq("id", id)
			.single();

		if (response.data == undefined || response.data.length == 0)
			return c.json({ error: "Response not found" }, 404);
		else if (response.error != undefined)
			return c.json({ error: response.error.message }, 500);

		if (user.uid != response.data.user_id)
			return c.json({ error: "Forbidden" }, 403);

		const update = await config.supabaseClient
			.from("responses")
			.update({ message: body.message })
			.eq("id", id)
			.select()
			.single();

		if (update.error) return c.json({ error: update.error.message }, 500);

		return c.json({ message: "Response updated successfully" }, 200);
	},
);

export default response_put;
