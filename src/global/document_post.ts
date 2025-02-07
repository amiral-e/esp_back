import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../config.ts";
import AdminMiddleware from "../middlewares/middleware_admin.ts";

import {
	Document,
	storageContextFromDefaults,
	VectorStoreIndex,
} from "llamaindex";

const document_post = new Hono();

document_post.post(
	"/collections/:collection_name/documents",
	AdminMiddleware,
	async (c: any) => {
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
				const fileContents = await file.text();
				// @ts-ignore
				docs.push(
					new Document({
						text: fileContents,
						metadata: {
							doc_id: Bun.randomUUIDv7(),
							doc_file: file.name,
							user: "global",
						},
					}),
				);
			} else if (file instanceof Array)
				return c.json({ error: `Please provide a single file in ${key}` }, 400);
			else return c.json({ error: "Invalid JSON" }, 400);
		}
		if (docs.length == 0) return c.json({ error: "No files provided" }, 400);

		config.pgvs.clearCollection();
		config.pgvs.setCollection("global_" + collection_name);

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

export default document_post;
