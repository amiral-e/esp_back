import { deleteCollectionHttp } from "./utils.ts"

/**
 * Deletes a collection.
 * 
 * @param c The context object.
 * @returns A JSON response with the result of the delete operation.
 */
async function delete_collection(c: any) {
	// Retrieve the user from the context object
	const user = c.get("user");
	// Check if the user has admin privileges, return a 403 Forbidden response if not
	if (!user.admin) return c.json({ error: "Forbidden" }, 403);

	// Extract the collection name from the request parameters
	const { collection_name } = c.req.param();
	// Construct the collection ID by prefixing the collection name with "global_"
	const collection_id = "global_" + collection_name;

	// Call the deleteCollectionHttp function to perform the delete operation
	return await deleteCollectionHttp(c, collection_id);
}

export default delete_collection;
