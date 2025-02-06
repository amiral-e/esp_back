import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../config.ts";
import AuthMiddleware from "../middlewares/middleware_auth.ts";

import {
	Document,
	storageContextFromDefaults,
	VectorStoreIndex,
} from "llamaindex";

const document_post = new Hono();

document_post.post(
	"/:collection_name/documents",
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

export default document_post;
