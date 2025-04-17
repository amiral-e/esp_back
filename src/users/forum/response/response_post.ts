import config from "../../../config.ts";
import AuthMiddleware from "../../../middlewares/auth.ts";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

const response_post = new Hono();

response_post.post(
	describeRoute({
		summary: "Create a new response",
		description: "This route creates a new response for the authenticated user",
		tags: ["users-forum-responses"],
		requestBody: {
			content: {
				"application/json": {
					schema: {
						type: "object",
						properties: {
							message: {
								type: "string",
								description: "The response message",
								example: "This is a response message",
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
									description: "The response message",
								},
								user_id: {
									type: "string",
									description: "The user ID who created the response",
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
		return await post_response(c);
	},
);

async function post_response(c: any) {
	const user = c.get("user");
	let body: any;

	try {
		body = await c.req.json();
		if (!body?.message) {
			return c.json({ error: "Message is required" }, 400);
		}
	} catch (error) {
		return c.json({ error: "Invalid JSON body" }, 400);
	}

	const insertion = await config.supabaseClient
		.from("responses")
		.insert({ message: body.message, user_id: user.uid })
		.select()
		.single();

	return c.json(
		{ message: "Response added successfully", id: insertion.data.id },
		200,
	);
}

export default response_post;
