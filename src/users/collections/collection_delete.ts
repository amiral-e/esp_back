import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../../config.ts";
import AuthMiddleware from "../../middlewares/auth.ts";

const collection_delete = new Hono();

collection_delete.delete(
	"/:collection_name",
	describeRoute({
		summary: "Delete a Collection",
		description: "Deletes a collection and all its embeddings. Auth is required.",
		tags: ["users-collections"],
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
									default: "Collection my-collection deleted successfully"
								}
							}
						}
					}
				}
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
										"Invalid user"
									],
								},
							},
							required: ["error"],
						},
					},
				},
			},
			404: {
				description: "Not found",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								error: {
									type: "string",
									default: "Collection not found",
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
		}
	}),
	AuthMiddleware,
	async (c: any) => {
		const user = c.get("user");
		const { collection_name } = c.req.param();
		const collection_id = user.uid + "_" + collection_name;

		const collection =
			await config.supabaseClient
				.from("llamaindex_embedding")
				.select("id, collection")
				.eq("collection", collection_id);
		if (collection.data == undefined || collection.data.length == 0)
			return c.json({ error: "Collection not found" }, 404);
		else if (collection.error != undefined)
			return c.json({ error: collection.error.message }, 500);

		for (const item of collection.data) {
			const deletion =
				await config.supabaseClient
					.from("llamaindex_embedding")
					.delete()
					.eq("id", item.id);
			if (deletion.error != undefined)
				return c.json({ error: deletion.error.message }, 500);
		}

		return c.json({ message: `Collection deleted successfully` }, 200);
	},
);

export default collection_delete;
