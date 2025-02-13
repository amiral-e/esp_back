import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../../config.ts";
import AuthMiddleware from "../../middlewares/middleware_auth.ts";

const document_delete = new Hono();

document_delete.delete(
	"/:document_id",
	describeRoute({
		summary: "Delete a document",
		description: "Deletes a document from the specified collection. Admin privileges are required.",
		tags: ["admins-documents"],
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
									default: "Document deleted successfully",
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
									default: ["No authorization header found", "Invalid authorization header", "Invalid user"],
								},
							},
						},
					},
				},
			},
			403: {
				description: "Forbidden",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								error: {
									type: "string",
									default: "Forbidden",
								},
							},
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
									default: "Document not found",
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
		if (!user.admin)
			return c.json({ error: "Forbidden" }, 403);

		const { collection_name, document_id } = c.req.param();
		const collection_id = "global_" + collection_name;

		const documents =
			await config.supabaseClient
				.from("llamaindex_embedding")
				.select("id, collection, metadata")
				.eq("collection", collection_id)
				.eq("metadata->>doc_id", document_id);
		if (documents.data == undefined || documents.data.length == 0)
			return c.json({ error: "Document not found" }, 404);
		if (documents.error != undefined)
			return c.json({ error: documents.error.message }, 500);

		for (const item of documents.data) {
			const { data, error } = await config.supabaseClient
				.from("llamaindex_embedding")
				.delete()
				.eq("id", item.id);
			if (error != undefined)
				return c.json({ error: error.message }, 500);
		}

		return c.json({ response: `Document deleted successfully` }, 200);
	},
);

export default document_delete;
