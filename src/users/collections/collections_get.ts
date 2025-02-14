import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../../config";
import AuthMiddleware from "../../middlewares/auth.ts";

const collections_get = new Hono();

collections_get.get(
	describeRoute({
		summary: "Get all collections",
		description:
			"Get all collections for the authenticated user. Auth is required.",
		tags: ["users-collections"],
		responses: {
			200: {
				description: "Success",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								collections: {
									type: "array",
									items: {
										type: "object",
										properties: {
											collection: { type: "string", default: "global_example" },
											user: { type: "string", default: "global" },
											name: { type: "string", default: "example" },
										},
									},
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
									default: "No collection found",
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
		const user = c.get("user");

		const { data, error } = await config.supabaseClient
			.from("llamaindex_embedding")
			.select("collection")
			.like("collection", user.uid + "_%");
		if (data == undefined || data.length == 0)
			return c.json({ error: "No collections found" }, 404);
		else if (error != undefined) return c.json({ error: error.message }, 500);

		const uniqueCollections = data.filter(
			(collection: any, index: any, self: any) =>
				index ===
				self.findIndex((t: any) => t.collection === collection.collection),
		);
		const collections = [
			...new Set(
				uniqueCollections.map((x: any) => {
					const collection_id = x.collection;
					const name = collection_id.replace(user.uid + "_", "");
					return { collection: collection_id, user: user.uid, name: name };
				}),
			),
		];
		return c.json({ collections: collections }, 200);
	},
);

export default collections_get;
