import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../../config.ts";
import AuthMiddleware from "../../middlewares/auth.ts";

const documents_get = new Hono();

documents_get.get(
	describeRoute({
		summary: "Get documents",
		description:
			"Get a list of documents in the specified collection. Auth is required.",
		tags: ["users-documents"],
		responses: {
			200: {
				description: "Success",
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
		},
	}),
	AuthMiddleware,
	async (c: any) => {
		const user = c.get("user");
		const { collection_name } = c.req.param();
		const collection_id = user.uid + "_" + collection_name;

		const documents = await config.supabaseClient
			.from("llamaindex_embedding")
			.select("id, collection, metadata")
			.eq("collection", collection_id);
		if (documents.data == undefined || documents.data.length == 0)
			return c.json({ error: "Collection not found" }, 404);
		else if (documents.error != undefined)
			return c.json({ error: documents.error.message }, 500);

		const docs = documents.data.reduce((acc: any[], x: any) => {
			if (!acc.some((y) => y.doc_id === x.metadata.doc_id))
				acc.push({ doc_id: x.metadata.doc_id, doc_file: x.metadata.doc_file });
			return acc;
		}, []);
		return c.json({ documents: docs }, 200);
	},
);

export default documents_get;
