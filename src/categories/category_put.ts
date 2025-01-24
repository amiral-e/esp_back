import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../config.ts";
import AdminMiddleware from "../middlewares/middleware_admin.ts";

const category_put = new Hono();

category_put.put("/:id",
	describeRoute({
		summary: 'Update category',
		description: 'This route updates a category',
		tags: ['categories'],
		parameters: [
			{
				in: 'path',
				name: 'id',
				description: 'The id of the category to update',
				required: true,
				schema: {
					type: 'string'
				}
			}
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
			required: false,
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
									default: 'Category name updated successfully',
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
			404: {
				description: 'Not found',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								error: {
									type: 'string',
									default: ['Category not found', 'User not found'],
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
	AdminMiddleware, async (c: any) => {
		const { id } = await c.req.param();
		let json: any;
		try {
			json = await c.req.json();
			if (!json || (json.name == undefined && json.description == undefined))
				return c.json({ error: "Invalid JSON" }, 400);
		} catch (error) {
			return c.json({ error: "Invalid JSON" }, 400);
		}

		const { data: categData, error: categError } = await config.supabaseClient
			.from("categories")
			.select("name")
			.eq("id", id)
			.single();
		if (categData == undefined || categData.length == 0)
			return c.json({ error: "Category not found" }, 404);
		else if (categError != undefined)
			return c.json({ error: categError.message }, 500);

		const { data: updateData, error: updateError } = await config.supabaseClient
			.from("categories")
			.update(json)
			.eq("id", id);
		if (updateError != undefined)
			return c.json({ error: updateError.message }, 500);
		return c.json(
			{ message: `Category ${categData.name} updated successfully` },
			200,
		);
	});

export default category_put;
