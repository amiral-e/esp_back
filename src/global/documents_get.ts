import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../config.ts";
import AdminMiddleware from "../middlewares/middleware_admin.ts";

const documents_get = new Hono();

documents_get.get(
	"/collections/:collection_name/documents",
	describeRoute({
		summary: "Get documents",
		description: "Get a list of documents in the specified collection. Admin privileges are required.",
		tags: ["global"],
		responses: {
			200: {
				description: "Documents retrieved successfully",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								documents: {
									type: "array",
									items: {
										type: "object",
										properties: {
											doc_id: {
												type: "string",
												description: "The document ID",
											},
											doc_file: {
												type: "string",
												description: "The document file name",
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
				description: "Unauthorized",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								error: {
									type: "string",
									description: "The error message",
									default: ["No authorization header found", "Invalid authorization header"],
								},
							},
						},
					},
				},
			},
			404: {
				description: "Resource not found",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								error: {
									type: "string",
									description: "The error message",
									default: ["Uid not found", "Collection not found"],
								},
							},
						},
					},
				},
			},
			500: {
				description: "Internal Server Error",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								error: {
									type: "string",
									description: "The error message",
									example: "Internal server error",
								},
							},
						},
					},
				},
			},
		},
	}),
	AdminMiddleware,
	async (c: any) => {
		const { collection_name } = c.req.param();
		const collection_id = "global_" + collection_name;

		const { data, error } = await config.supabaseClient
			.from("llamaindex_embedding")
			.select("id, collection, metadata")
			.eq("collection", collection_id);
		if (data == undefined || data.length == 0)
			return c.json({ error: "Collection not found" }, 404);
		else if (error != undefined) return c.json({ error: error.message }, 500);

		const docs = data.reduce((acc: any[], x: any) => {
			if (!acc.some((y) => y.doc_id === x.metadata.doc_id)) {
				acc.push({ doc_id: x.metadata.doc_id, doc_file: x.metadata.doc_file });
			}
			return acc;
		}, []);
		return c.json({ documents: docs }, 200);
	},
);

export default documents_get;
