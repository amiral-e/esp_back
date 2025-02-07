import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../config.ts";
import AuthMiddleware from "../middlewares/middleware_auth.ts";

const collection_delete = new Hono();

collection_delete.delete(
	"/:collection_name",
	describeRoute({
		summary: "Delete a Collection",
		description: "Deletes a collection and all its embeddings. Auth is required.",
		tags: ["collections"],
		parameters: [
			{
				in: "path",
				name: "collection_name",
				required: true,
				schema: {
					type: "string"
				}
			}
		],
		responses: {
			"200": {
				description: "Collection deleted successfully",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								message: {
									type: "string",
									example: "Collection my-collection deleted successfully"
								}
							}
						}
					}
				}
			},
			"404": {
				description: "Collection not found",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								error: {
									type: "string",
									example: "Collection not found"
								}
							}
						}
					}
				}
			},
			"500": {
				description: "Internal server error",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								error: {
									type: "string",
									example: "Database error message"
								}
							}
						}
					}
				}
			}
		}
	}),
	AuthMiddleware,
	async (c: any) => {
		const user = c.get("user");
		const { collection_name } = c.req.param();
		const collection_id = user.uid + "_" + collection_name;

		const { data: collectionData, error: collectionError } =
			await config.supabaseClient
				.from("llamaindex_embedding")
				.select("id, collection")
				.eq("collection", collection_id);
		if (collectionData == undefined || collectionData.length == 0)
			return c.json({ error: "Collection not found" }, 404);
		else if (collectionError != undefined)
			return c.json({ error: collectionError.message }, 500);

		for (const item of collectionData) {
			const { data: deletedCollection, error: deleteError } =
				await config.supabaseClient
					.from("llamaindex_embedding")
					.delete()
					.eq("id", item.id);
			if (deleteError != undefined)
				return c.json({ error: deleteError.message }, 500);
		}

		return c.json(
			{ message: `Collection ${collection_name} deleted successfully` },
			200,
		);
	},
);

export default collection_delete;
