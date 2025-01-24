import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../config.ts";
import AuthMiddleware from "../middlewares/middleware_auth.ts";

const collection_delete = new Hono();

collection_delete.delete(
	"/:collection_name",
	describeRoute({
		summary: 'Delete collection',
		description: 'This route deletes a collection',
		tags: ['collections'],
		parameters: [
			{
				in: 'path',
				name: 'collection_name',
				description: 'The name of the collection to delete',
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
									default: 'Collection name deleted successfully',
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
									default: ['Uid not found', 'Collection not found'],
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
	AuthMiddleware,
	async (c: any) => {
		const user = c.get("user");
		const { collection_name } = c.req.param();
		const table_name = user.uid + "_" + collection_name;

		const { data: collectionData, error: collectionError } =
			await config.supabaseClient
				.schema("vecs")
				.rpc("get_vecs", { name: user.uid + "_" + collection_name });
		if (collectionData == undefined || collectionData.length == 0)
			return c.json({ error: "Collection not found" }, 404);
		else if (collectionError != undefined)
			return c.json({ error: collectionError.message }, 500);

		const { data: deletedCollection, error: deleteError } =
			await config.supabaseClient
				.schema("vecs")
				.rpc("drop_table_if_exists", { table_name: table_name });
		if (deleteError != undefined)
			return c.json({ error: deleteError.message }, 500);
		return c.json(
			{ message: `Collection ${table_name} deleted successfully` },
			200,
		);
	},
);

export default collection_delete;
