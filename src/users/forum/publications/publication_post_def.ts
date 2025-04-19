import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import AuthMiddleware from "../../../middlewares/auth.ts";
import post_create from "./publication_post.ts";

const create_post = new Hono();

create_post.post(
	"/",
	describeRoute({
		summary: "Create a new post",
		description:
			"Allows an authenticated user to create a new post in the database.",
		tags: ["users-posts"],
		requestBody: {
			required: true,
			content: {
				"application/json": {
					schema: {
						type: "object",
						properties: {
							title: { type: "string", example: "My first post" },
							content: { type: "string", example: "Hello world!" },
						},
						required: ["title", "content"],
					},
				},
			},
		},
		responses: {
			201: {
				description: "Post created successfully",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								message: {
									type: "string",
									default: "Post created successfully",
								},
								post: {
									type: "object",
									properties: {
										id: { type: "number" },
										title: { type: "string" },
										content: { type: "string" },
										user_id: { type: "string" },
										created_at: { type: "string" },
									},
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
								error: { type: "string", default: "Missing title or content" },
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
								error: { type: "string", default: "Invalid user" },
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
								error: { type: "string", default: "Error message" },
							},
						},
					},
				},
			},
		},
	}),
	AuthMiddleware,
	async (c: any) => {
		return await post_create(c);
	},
);

export default create_post;
