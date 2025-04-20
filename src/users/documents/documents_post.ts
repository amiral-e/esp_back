import config from "../../config.ts";
import { decrease_credits, check_credits } from "../profile/utils.ts";

import {
	Document,
	storageContextFromDefaults,
	VectorStoreIndex,
} from "llamaindex";

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const ALLOWED_FILE_TYPES = ["text/markdown", "text/plain;charset=utf-8"];

async function processFiles(json: any, user: any): Promise<{ docs: Document[]; tokens: number; error?: string }> {
	let tokens = 0;
	const docs: Document[] = [];
	for (const key in json) {
		const file = json[key];
		if (file instanceof File) {
			if (file.size > MAX_FILE_SIZE) {
				return { docs: [], tokens: 0, error: "File size exceeds limit" };
			}
			if (!ALLOWED_FILE_TYPES.includes(file.type)) {
				return { docs: [], tokens: 0, error: "File type not allowed" };
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
			return { docs: [], tokens: 0, error: `Please provide a single file in ${key}` };
		else return { docs: [], tokens: 0, error: "Invalid JSON" };
	}
	return { docs, tokens };
}

async function post_documents(c: any) {
	const user = c.get("user");
	const { collection_name } = c.req.param();

	let json: any;
	try {
		json = await c.req.parseBody({ all: true });
	} catch (error) {
		return c.json({ error: "Invalid JSON" }, 400);
	}

	const result = await processFiles(json, user);
	if (result.error) return c.json({ error: result.error }, 400);
	if (result.docs.length == 0) return c.json({ error: "No files provided" }, 400);

	const validate_credits = await check_credits(result.tokens, user.uid, false, true);
	if (validate_credits != "Success")
		return c.json({ error: "Not enough credits" }, 402);

	config.pgvs.setCollection(user.uid + "_" + collection_name);

	const ctx = await storageContextFromDefaults({ vectorStore: config.pgvs });
	await VectorStoreIndex.fromDocuments(result.docs, {
		storageContext: ctx,
	});

	const increment_total_docs = await config.supabaseClient
		.schema("public")
		.rpc("increment_total_docs", {
			p_user_id: user.uid,
			p_docs_to_add: result.docs.length,
		});
	if (increment_total_docs.error != undefined)
		return c.json({ error: increment_total_docs.error.message }, 500);

	const credits = await decrease_credits(result.tokens, user.uid, "openai_embedding");
	if (credits != "Success") return c.json({ error: credits }, 500);

	return c.json(
		{
			message: `You have ingested ${result.docs.length} documents into the collection ${collection_name}`,
		},
		200,
	);
}

export default post_documents;
