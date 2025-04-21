import config from "../../config.ts";

/**
 * Deletes a document from the database.
 * 
 * @param {any} c The request context.
 * @param {string} c.req.param().collection_name The name of the collection.
 * @param {string} c.req.param().document_id The ID of the document to delete.
 * @returns {Promise<void>} A promise that resolves with a JSON response.
 */
async function delete_document(c: any) {
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
}

export default delete_document;
