import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../../../config.ts";
import AuthMiddleware from "../../../middlewares/auth.ts";

const category_post = new Hono();

category_post.post(
	describeRoute({
		summary: "Create Category",
		description:
			"Creates a new category in the database. Admin privileges are required.",
		tags: ["admins-forum-categories"],
		requestBody: {
			required: true,
			content: {
				"application/json": {
					schema: {
						type: "object",
						properties: {
							name: {
								type: "string",
								description: "The name of the category",
								default: "New Category",
							},
							description: {
								type: "string",
								description: "The description of the category",
								default: "Description of new category",
							},
						},
						required: ["name", "description"],
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
									default: "Category created successfully",
								},
							},
							required: ["message"],
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
			403: {
				description: "Forbidden",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								error: {
									type: "string",
									default: "Forbidden",
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
		return await post_category(c);
	},
);

async function post_category(c: any) {
	const user = c.get("user");
	if (!user.admin) return c.json({ error: "Forbidden" }, 403);

	let json: any;
	try {
		json = await c.req.json();
		if (json?.name == undefined || json?.description == undefined)
			return c.json({ error: "Invalid JSON" }, 400);
	} catch (error) {
		return c.json({ error: "Invalid JSON" }, 400);
	}

	await config.supabaseClient
		.from("categories")
		.insert(json)
		.select("*");

	return c.json({ message: "Category created successfully" }, 200);
}

export default category_post;
