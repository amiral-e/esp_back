import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../../config.ts";
import AuthMiddleware from "../../middlewares/auth.ts";

import {
	Document,
	storageContextFromDefaults,
	VectorStoreIndex,
} from "llamaindex";

const documents_post = new Hono();

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const ALLOWED_FILE_TYPES = ["text/markdown", "text/plain;charset=utf-8"];

documents_post.post(
	describeRoute({
		summary: "Ingest documents",
		description:
			"Ingest documents in the specified collection. Auth is required.",
		tags: ["users-documents"],
		"multipart/form-data": {
			schema: {
				type: "object",
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
										"You have ingested X documents into the collection Y",
								},
							},
						},
					},
				},
			},
			400: {
				description: "Bad Request",
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
										"File size exceeds limit",
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
			500: {
				description: "Internal Server Error",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								error: {
									type: "string",
									default: "Internal server error",
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
				if (file.size > MAX_FILE_SIZE) {
					return c.json({ error: "File size exceeds limit" }, 400);
				}
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
							user: user.uid,
						},
					}),
				);
			} else if (file instanceof Array)
				return c.json({ error: `Please provide a single file in ${key}` }, 400);
			else return c.json({ error: "Invalid JSON" }, 400);
		}
		if (docs.length == 0) return c.json({ error: "No files provided" }, 400);

		config.pgvs.setCollection(user.uid + "_" + collection_name);

		const ctx = await storageContextFromDefaults({ vectorStore: config.pgvs });
		const index = await VectorStoreIndex.fromDocuments(docs, {
			storageContext: ctx,
		});
		return c.json(
			{
				message: `You have ingested ${docs.length} documents into the collection ${collection_name}`,
			},
			200,
		);
	},
);

export default documents_post;
