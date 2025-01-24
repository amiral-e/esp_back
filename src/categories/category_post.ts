import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../config.ts";
import AdminMiddleware from "../middlewares/middleware_admin.ts";

const category_post = new Hono();

category_post.post("/",
	describeRoute({
		summary: 'Create category',
		description: 'This route creates a category',
		tags: ['categories'],
		requestBody: {
			content: {
				'application/json': {
					schema: {
						type: 'object',
						properties: {
							name: {
								type: 'string',
								default: 'name',
								description: 'The name of the category',
							},
							description: {
								type: 'string',
								default: 'this is a description',
								description: 'The description of the category',
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
								message: {
									type: 'string',
									default: 'Category name created successfully',
									description: 'The message',
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
									default: ['No authorization header found', 'Invalid authorization header', 'You don\'t have admin privileges'],
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
	AdminMiddleware, async (c) => {
		let json: any;
		try {
			json = await c.req.json();
			if (!json || json.name == undefined || json.description == undefined)
				return c.json({ error: "Invalid JSON" }, 400);
		} catch (error) {
			return c.json({ error: "Invalid JSON" }, 400);
		}

		const { data, error } = await config.supabaseClient
			.from("categories")
			.insert(json)
			.select("*");
		if (error != undefined) return c.json({ error: error.message }, 500);
		return c.json(
			{ message: `Category ${json.name} created successfully` },
			200,
		);
	});

export default category_post;
