import { deleteCollectionHttp } from "../../admins/collections/utils.ts";

/**
 * Deletes a collection based on the provided collection name.
 * 
 * @param {any} c - The context object containing the user and request parameters.
 * @returns {Promise<any>} - A promise resolving to the result of the delete operation.
 */
async function delete_collection(c: any) {
	const user = c.get("user");
	const { collection_name } = c.req.param();
	const collection_id = user.uid + "_" + collection_name;

	return await deleteCollectionHttp(c, collection_id);
}

export default delete_collection;
