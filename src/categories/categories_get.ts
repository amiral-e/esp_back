import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../config.ts";
import AuthMiddleware from "../middlewares/middleware_auth.ts";

const categories_get = new Hono();

categories_get.get("/",
	describeRoute({
		summary: 'Get all categories',
		description: 'This route returns all categories',
		tags: ['categories'],
		responses: {
			200: {
				description: 'OK',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								categories: {
									type: 'array',
									items: {
										type: 'object',
										properties: {
											id: {
												type: 'string',
												default: '1',
												description: 'The category id',
											},
											name: {
												type: 'string',
												default: 'test',
												description: 'The category name',
											},
											description: {
												type: 'string',
												default: 'this is a description',
												description: 'The category description',
											},
										},
									},
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
									default: ['Uid not found', 'No categories found'],
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
	AuthMiddleware, async (c) => {
		const { data, error } = await config.supabaseClient
			.from("categories")
			.select("*");
		if (data == undefined || data.length == 0)
			return c.json({ error: "No categories found" }, 404);
		else if (error != undefined) return c.json({ error: error.message }, 500);
		return c.json({ categories: data }, 200);
	});

export default categories_get;
