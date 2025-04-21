import config from "../../config.ts";

/**
 * Retrieves a list of documents from the database.
 * 
 * @param {any} c The request context.
 * @param {string} c.req.param().collection_name The name of the collection.
 * @returns {Promise<void>} A promise that resolves with a JSON response containing the list of documents.
 */
async function get_documents(c: any) {
  // Extract the user object from the request context
  const user = c.get("user");
  // Extract the collection name from the request parameters
  const { collection_name } = c.req.param();
  // Construct the collection ID by combining the user ID and collection name
  const collection_id = user.uid + "_" + collection_name;

  // Query the database for documents in the specified collection
  const documents = await config.supabaseClient
    .from("llamaindex_embedding")
    .select("id, collection, metadata")
    .eq("collection", collection_id);
  
  // Check if the collection exists and has documents
  if (documents.data == undefined || documents.data.length == 0)
    // If not, return a 404 error with a "Collection not found" message
    return c.json({ error: "Collection not found" }, 404);
  else if (documents.error != undefined)
    // If the query failed, return a 500 error with the error message
    return c.json({ error: documents.error.message }, 500);

  // Process the query results to extract unique document IDs and files
  const docs = documents.data.reduce((acc: any[], x: any) => {
    // Check if the document ID is already in the accumulator
    if (!acc.some((y) => y.doc_id === x.metadata.doc_id))
      // If not, add it to the accumulator
      acc.push({ doc_id: x.metadata.doc_id, doc_file: x.metadata.doc_file });
    return acc;
  }, []);
  // Return the processed documents as a JSON response with a 200 status code
  return c.json({ documents: docs }, 200);
}

export default get_documents;