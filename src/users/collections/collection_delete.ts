import { deleteCollectionHttp } from "../../admins/collections/utils.ts";

/**
 * Deletes a collection based on the provided collection name.
 * 
 * @param {any} c - The context object containing the user and request parameters.
 * @returns {Promise<any>} - A promise resolving to the result of the delete operation.
 */
async function delete_collection(c: any) {
  // Extract the user object from the context
  const user = c.get("user");
  
  // Retrieve the collection name from the request parameters
  const { collection_name } = c.req.param();
  
  // Construct the collection ID by concatenating the user ID and collection name
  const collection_id = user.uid + "_" + collection_name;

  // Call the deleteCollectionHttp function to perform the delete operation
  return await deleteCollectionHttp(c, collection_id);
}

export default delete_collection;