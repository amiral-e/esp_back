import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../config.ts";
import AdminMiddleware from "../middlewares/middleware_admin.ts";

const category_delete = new Hono();

category_delete.delete("/:id",
	describeRoute({
		summary: 'Delete category',
		description: 'This route deletes a category',
		tags: ['categories'],
		parameters: [
			{
				in: 'path',
				name: 'id',
				description: 'The id of the category to delete',
				required: true,
				schema: {
					type: 'string'
				}
			}
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
									default: 'Category name deleted successfully',
									description: 'The message',
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

		const { data: categData, error: categError } = await config.supabaseClient
			.from("categories")
			.select("*")
			.eq("id", id)
			.single();
		if (categData == undefined || categData.length == 0)
			return c.json({ error: "Category not found" }, 404);
		if (categError != undefined)
			return c.json({ error: categError.message }, 500);

		const { data: delData, error: delError } = await config.supabaseClient
			.from("categories")
			.delete()
			.eq("id", id)
			.select("*");
		if (delError != undefined) return c.json({ error: delError.message }, 500);
		return c.json(
			{ message: `Category ${categData.name} deleted successfully` },
			200,
		);
	});

export default category_delete;
