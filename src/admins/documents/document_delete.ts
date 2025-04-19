import config from "../../config.ts";

async function delete_document(c: any) {
	const user = c.get("user");
	if (!user.admin) return c.json({ error: "Forbidden" }, 403);

	const { collection_name, document_id } = c.req.param();
	const collection_id = "global_" + collection_name;

	const documents = await config.supabaseClient
		.from("llamaindex_embedding")
		.select("id, collection, metadata")
		.eq("collection", collection_id)
		.eq("metadata->>doc_id", document_id);
	if (documents.data == undefined || documents.data.length == 0)
		return c.json({ error: "Document not found" }, 404);
	if (documents.error != undefined)
		return c.json({ error: documents.error.message }, 500);

	for (const item of documents.data) {
		const { error } = await config.supabaseClient
			.from("llamaindex_embedding")
			.delete()
			.eq("id", item.id);
		if (error != undefined) return c.json({ error: error.message }, 500);
	}

	return c.json({ message: `Document deleted successfully` }, 200);
}

export default delete_document;
