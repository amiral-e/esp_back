import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../../config.ts";

import {
	Document,
	storageContextFromDefaults,
	VectorStoreIndex,
} from "llamaindex";
import AuthMiddleware from "../../middlewares/auth.ts";

const documents_post = new Hono();

const ALLOWED_FILE_TYPES = ["text/markdown", "text/plain;charset=utf-8"];

documents_post.post(
	"/:collection_name/documents",
	describeRoute({
		summary: "Ingest documents",
		description:
			"Ingest documents in the specified collection. Admin privileges are required.",
		tags: ["admins-documents"],
		requestBody: {
			required: true,
			description: "Files to ingest",
			content: {
				"multipart/form-data": {
					schema: {
						type: "object",
					},
				},
			},
		},
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
									default:
										"You have ingested 1 documents into the collection example",
								},
							},
						},
					},
				},
			},
			400: {
				description: "Bad request",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								error: {
									type: "string",
									default: [
										"Invalid JSON",
										"No files provided",
										"Please provide a single file at a time",
										"File type not allowed",
									],
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
		if (!user.admin) return c.json({ error: "Forbidden" }, 403);

		const { collection_name } = c.req.param();

		let json: any;
		try {
			json = await c.req.parseBody({ all: true });
		} catch (error) {
			return c.json({ error: "Invalid JSON" }, 400);
		}

		const docs: Document[] = [];
		for (const key in json) {
			const file = json[key];
			if (file instanceof File) {
				if (!ALLOWED_FILE_TYPES.includes(file.type)) {
					return c.json({ error: "File type not allowed" }, 400);
				}
				const fileContents = await file.text();
				docs.push(
					new Document({
						text: fileContents,
						metadata: {
							// @ts-ignore
							doc_id: Bun.randomUUIDv7(),
							doc_file: file.name,
							user: "global",
						},
					}),
				);
			} else if (file instanceof Array)
				return c.json({ error: `Please provide a single file at a time` }, 400);
			else return c.json({ error: "Invalid JSON" }, 400);
		}
		if (docs.length == 0) return c.json({ error: "No files provided" }, 400);

		config.pgvs.setCollection("global_" + collection_name);

		const ctx = await storageContextFromDefaults({ vectorStore: config.pgvs });
		await VectorStoreIndex.fromDocuments(docs, {
			storageContext: ctx,
		});

		const increment_total_docs = await config.supabaseClient.rpc(
			"increment_total_docs",
			{ p_user_id: user.uid, p_docs_to_add: docs.length },
		);

		return c.json(
			{
				message: `You have ingested ${docs.length} documents into the collection ${collection_name}`,
			},
			200,
		);
	},
);

export default documents_post;
