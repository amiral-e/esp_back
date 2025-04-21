import config from "../../config.ts";

/**
 * Retrieves a list of collections for the current user.
 * 
 * @param {any} c - The context object containing the user.
 * @returns {Promise<any>} - A promise resolving to a JSON response containing the list of collections.
 */
async function get_collections(c: any) {
  // Get the user object from the context
  const user = c.get("user");

  // Query the Supabase database for collections belonging to the current user
  const { data, error } = await config.supabaseClient
    .from("llamaindex_embedding")
    .select("collection")
    .like("collection", user.uid + "_%");

  // Handle cases where no collections are found or an error occurs
  if (data == undefined || data.length == 0)
    return c.json({ error: "No collections found" }, 404);
  else if (error != undefined) return c.json({ error: error.message }, 500);

  // Filter the data to get unique collections
  const uniqueCollections = data.filter(
    (collection: any, index: any, self: any) =>
      index ===
      self.findIndex((t: any) => t.collection === collection.collection),
  );

  // Create a new set of collections with the required information
  const collections = [
    ...new Set(
      uniqueCollections.map((x: any) => {
        // Extract the collection ID and name from the collection string
        const collection_id = x.collection;
        const name = collection_id.replace(user.uid + "_", "");
        return { collection: collection_id, user: user.uid, name: name };
      }),
    ),
  ];

  // Return the list of collections as a JSON response
  return c.json({ collections: collections }, 200);
}

export default get_collections;