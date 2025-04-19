import config from "../../config.ts";

import {
	Document,
	storageContextFromDefaults,
	VectorStoreIndex,
} from "llamaindex";
const ALLOWED_FILE_TYPES = ["text/markdown", "text/plain;charset=utf-8"];

async function post_documents(c: any) {
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

	await config.supabaseClient.rpc(
		"increment_total_docs",
		{ p_user_id: user.uid, p_docs_to_add: docs.length },
	);

	return c.json(
		{
			message: `You have ingested ${docs.length} documents into the collection ${collection_name}`,
		},
		200,
	);
}

export default post_documents;
