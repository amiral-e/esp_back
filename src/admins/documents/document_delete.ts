import config from "../../config.ts";

/**
 * Deletes a specific document from a collection.
 * 
 * @param {any} c The request context.
 * @param {string} c.req.param().collection_name The name of the collection.
 * @param {string} c.req.param().document_id The ID of the document to delete.
 * @returns {Promise<any>} A promise that resolves with a JSON object containing a success message or an error.
 */
async function delete_document(c: any) {
	// Check if the user making the request is an admin
	const user = c.get("user");
	if (!user.admin) return c.json({ error: "Forbidden" }, 403);

	// Extract collection name and document ID from the request parameters
	const { collection_name, document_id } = c.req.param();
	// Construct the collection ID by prefixing the collection name with "global_"
	const collection_id = "global_" + collection_name;

	// Query the Supabase database to find documents matching the collection ID and document ID
	const documents = await config.supabaseClient
		.from("llamaindex_embedding")
		.select("id, collection, metadata")
		.eq("collection", collection_id)
		.eq("metadata->>doc_id", document_id);

	// Check if any documents were found
	if (documents.data == undefined || documents.data.length == 0)
		return c.json({ error: "Document not found" }, 404);
	// Check if there was an error querying the database
	if (documents.error != undefined)
		return c.json({ error: documents.error.message }, 500);

	// Delete each document found in the previous query
	for (const item of documents.data) {
		// Perform the delete operation
		const { error } = await config.supabaseClient
			.from("llamaindex_embedding")
			.delete()
			.eq("id", item.id);
		// Check if there was an error deleting the document
		if (error != undefined) return c.json({ error: error.message }, 500);
	}

	// Return a success message
	return c.json({ message: `Document deleted successfully` }, 200);
}

export default delete_document;