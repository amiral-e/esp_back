import { deleteCollectionHttp } from "./utils.ts"

/**
 * Deletes a collection.
 * 
 * @param c The context object.
 * @returns A JSON response with the result of the delete operation.
 */
async function delete_collection(c: any) {
	const user = c.get("user");
	if (!user.admin) return c.json({ error: "Forbidden" }, 403);

	const { collection_name } = c.req.param();
	const collection_id = "global_" + collection_name;

	return await deleteCollectionHttp(c, collection_id);
}

export default delete_collection;
