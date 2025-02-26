import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../../config.ts";
import AuthMiddleware from "../../middlewares/auth.ts";

const document_delete = new Hono();

document_delete.delete(
	"/:document_id",
	describeRoute({
		summary: "Delete a document by doc_id",
		description:
			"Deletes a document from the specified collection. Auth is required.",
		tags: ["users-documents"],
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
									example: "Document deleted successfully",
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
		const { collection_name, document_id } = c.req.param();
		const collection_id = user.uid + "_" + collection_name;

		const document_parts = await config.supabaseClient
			.from("llamaindex_embedding")
			.select("id, collection, metadata")
			.eq("collection", collection_id)
			.eq("metadata->>doc_id", document_id);
		if (document_parts.data == undefined || document_parts.data.length == 0)
			return c.json({ error: "Document not found" }, 404);
		if (document_parts.error != undefined)
			return c.json({ error: document_parts.error.message }, 500);

		for (const item of document_parts.data) {
			const deletion = await config.supabaseClient
				.from("llamaindex_embedding")
				.delete()
				.eq("id", item.id);
			if (deletion.error != undefined)
				return c.json({ error: deletion.error.message }, 500);
		}

		return c.json({ message: `Document deleted successfully` }, 200);
	},
);

export default document_delete;
