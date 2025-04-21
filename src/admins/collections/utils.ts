import config from "../../config.ts";
import { getUser } from "../../middlewares/utils.ts";
import { createCollection, deleteCollection } from "../../users/collections/utils.ts";

/**
 * Creates a new global collection.
 * 
 * @param userId The ID of the user creating the collection.
 * @param collectionName The name of the collection to create.
 * @returns The ID of the created collection, or an empty string if the user is not an admin.
 */
async function createGlobalCollection(userId: string, collectionName: string) {
  // Retrieve the user's data to check for admin privileges
	const user = await getUser(userId);
  // Check if the user is an admin, return empty string if not
	if (!user.admin) return "";
  // If the user is an admin, proceed with creating the collection
	return await createCollection(userId, collectionName);
}

/**
 * Deletes a global collection.
 * 
 * @param userId The ID of the user deleting the collection.
 * @param collectionName The name of the collection to delete.
 * @returns True if the collection was deleted successfully, or false if the user is not an admin.
 */
async function deleteGlobalCollection(userId: string, collectionName: string) {
  // Retrieve the user's data to check for admin privileges
	const user = await getUser(userId);
  // Check if the user is an admin, return false if not
	if (!user.admin) return false;
  // If the user is an admin, proceed with deleting the collection
	await deleteCollection(collectionName);
}

/**
 * Deletes a collection via HTTP.
 * 
 * @param c The context object.
 * @param collection_id The ID of the collection to delete.
 * @returns A JSON response with the result of the delete operation.
 */
async function deleteCollectionHttp(c: any, collection_id: string) {
  // Query the database to retrieve the collection data
	const collection = await config.supabaseClient
		.from("llamaindex_embedding")
		.select("id, collection")
		.eq("collection", collection_id);
  // Check if the collection exists, return 404 if not
	if (collection.data == undefined || collection.data.length == 0)
		return c.json({ error: "Collection not found" }, 404);
  // Check for database errors, return 500 if any
	else if (collection.error != undefined)
		return c.json({ error: collection.error.message }, 500);

  // Iterate over each item in the collection and delete it
	for (const item of collection.data) {
    // Delete the item from the database
		const deletion = await config.supabaseClient
			.from("llamaindex_embedding")
			.delete()
			.eq("id", item.id);
    // Check for database errors, return 500 if any
		if (deletion.error != undefined)
			return c.json({ error: deletion.error.message }, 500);
	}

  // Return a success message if all items are deleted
	return c.json({ message: `Collection deleted successfully` }, 200);
}

export { createGlobalCollection, deleteGlobalCollection, deleteCollectionHttp };