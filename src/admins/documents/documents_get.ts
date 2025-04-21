import config from "../../config.ts";

/**
 * Retrieves the list of documents from a specific collection.
 * 
 * @param {any} c The request context.
 * @param {string} c.req.param().collection_name The name of the collection.
 * @returns {Promise<any>} A promise that resolves with a JSON object containing the list of documents or an error.
 */
async function get_documents(c: any) {
  // Check if the user is an admin, return 403 Forbidden if not
  const user = c.get("user");
  if (!user.admin) return c.json({ error: "Forbidden" }, 403);

  // Extract the collection name from the request parameters
  const { collection_name } = c.req.param();
  const collection_id = "global_" + collection_name;

  // Query the Supabase client for documents in the specified collection
  const documents = await config.supabaseClient
    .from("llamaindex_embedding")
    .select("id, collection, metadata")
    .eq("collection", collection_id);

  // Check if the collection was not found, return 404 Not Found if so
  if (documents.data == undefined || documents.data.length == 0)
    return c.json({ error: "Collection not found" }, 404);
  // Check if there was an error, return 500 Internal Server Error if so
  else if (documents.error != undefined)
    return c.json({ error: documents.error.message }, 500);

  // Deduplicate documents by doc_id and extract relevant metadata
  const uniqueDocuments = documents.data.reduce((acc: any[], x: any) => {
    // Check if the document is not already in the accumulator
    if (!acc.some((y) => y.doc_id === x.metadata.doc_id))
      // Add the document to the accumulator
      acc.push({ doc_id: x.metadata.doc_id, doc_file: x.metadata.doc_file });
    return acc;
  }, []);

  // Return the list of unique documents
  return c.json({ documents: uniqueDocuments }, 200);
}

export default get_documents;