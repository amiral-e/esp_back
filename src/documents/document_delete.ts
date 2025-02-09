import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../config.ts";
import AuthMiddleware from "../middlewares/middleware_auth.ts";

const document_delete = new Hono();

document_delete.delete(
	"/:collection_name/documents/:document_id",
	describeRoute({
		summary: "Delete a document",
		description: "Deletes a document from the specified collection. Auth is required.",
		tags: ["documents"],
		responses: {
			200: {
				description: "Document deleted successfully",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								message: {
									type: "string",
									description: "Success message",
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
									description: "The error message",
									default: ["No authorization header found", "Invalid authorization header"]
								}
							}
						}
					}
				}
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
									default: ["Uid not found", "Document not found"]
								}
							}
						}
					}
				}
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
									example: "Internal server error"
								}
							}
						}
					}
				}
			}
		},
	}),
	AuthMiddleware,
	async (c: any) => {
		const user = c.get("user");
		const { collection_name, document_id } = c.req.param();
		const collection_id = user.uid + "_" + collection_name;

		const { data: docsData, error: docsError } = await config.supabaseClient
			.from("llamaindex_embedding")
			.select("id, collection, metadata")
			.eq("collection", collection_id)
			.eq("metadata->>doc_id", document_id);
		if (docsData == undefined || docsData.length == 0)
			return c.json({ error: "Document not found" }, 404);
		if (docsError != undefined)
			return c.json({ error: docsError.message }, 500);

		for (const item of docsData) {
			const { data, error } = await config.supabaseClient
				.from("llamaindex_embedding")
				.delete()
				.eq("id", item.id);
			if (error != undefined) return c.json({ error: error.message }, 500);
		}

		return c.json(
			{ message: `Document ${document_id} deleted successfully` },
			200,
		);
	},
);

export default document_delete;
