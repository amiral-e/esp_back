import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../config";
import AuthMiddleware from "../middlewares/middleware_auth.ts";

const collections_get = new Hono();

collections_get.get(
	describeRoute({
		summary: 'Get all collections',
		description: 'This route returns all collections',
		tags: ['collections'],
		responses: {
			200: {
				description: 'OK',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								collections: {
									type: 'array',
									items: {
										type: 'object',
										properties: {
											table_name: {
												type: 'string',
												default: 'table_name',
												description: 'The table name of the collection',
											},
											uid: {
												type: 'string',
												default: 'uid',
												description: 'The unique identifier of the collection',
											},
											name: {
												type: 'string',
												default: 'name',
												description: 'The name of the collection',
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
									default: ['Uid not found', 'No collections found'],
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

		const { data, error } = await config.supabaseClient
			.schema("vecs")
			.rpc("get_vecs", { name: user.uid + "%" });
		if (data == undefined || data.length == 0)
			return c.json({ error: "No collections found" }, 404);
		else if (error != undefined) return c.json({ error: error.message }, 500);

		const collections = data.map((item: any) => {
			const tableName = item.vec_table_name;
			const name = tableName.replace(user.uid + "_", "");
			return { table_name: tableName, uid: user.uid, name: name };
		});
		return c.json({ collections: collections }, 200);
	});

export default collections_get;
