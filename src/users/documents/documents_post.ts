import config from "../../config.ts";
import { decrease_credits, check_credits } from "../profile/utils.ts";

import {
	Document,
	storageContextFromDefaults,
	VectorStoreIndex,
} from "llamaindex";

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const ALLOWED_FILE_TYPES = ["text/markdown", "text/plain;charset=utf-8"];

async function post_documents(c: any) {
	const user = c.get("user");
	const { collection_name } = c.req.param();

	let json: any;
	try {
		json = await c.req.parseBody({ all: true });
	} catch (error) {
		return c.json({ error: "Invalid JSON" }, 400);
	}

	const docs: Document[] = [];
	let tokens = 0;
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
			tokens += fileContents.length;
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

	const validate_credits = await check_credits(tokens, user.uid, false, true);
	if (validate_credits != "Success")
		return c.json({ error: "Not enough credits" }, 402);

	config.pgvs.setCollection(user.uid + "_" + collection_name);

	const ctx = await storageContextFromDefaults({ vectorStore: config.pgvs });
	await VectorStoreIndex.fromDocuments(docs, {
		storageContext: ctx,
	});

	const increment_total_docs = await config.supabaseClient
		.schema("public")
		.rpc("increment_total_docs", {
			p_user_id: user.uid,
			p_docs_to_add: docs.length,
		});
	if (increment_total_docs.error != undefined)
		return c.json({ error: increment_total_docs.error.message }, 500);

	const credits = await decrease_credits(tokens, user.uid, "openai_embedding");
	if (credits != "Success") return c.json({ error: credits }, 500);

	return c.json(
		{
			message: `You have ingested ${docs.length} documents into the collection ${collection_name}`,
		},
		200,
	);
}

export default post_documents;
