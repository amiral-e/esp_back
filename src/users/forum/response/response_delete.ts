import config from "../../../config.ts";
import { isAdmin } from "../../../admins/utils.ts";

/**
 * Deletes a response.
 * 
 * @param {any} c - The context object containing the user and request data.
 * @returns {Promise<any>} A JSON response with a success message or an error message.
 */
async function delete_response(c: any) {
  // Retrieve the user object from the context
  const user = c.get("user");
  // Get the response id from the request parameters
  const id = c.req.param("id");

  // Query the database to retrieve the response with the given id
  const response = await config.supabaseClient
    .from("responses")
    .select("*")
    .eq("id", id)
    .single();

  // Check if the response exists
  if (response.data == undefined || response.data.length == 0)
    // Return a 404 error if the response is not found
    return c.json({ error: "Response not found" }, 404);

  // Check if the user is an admin or the owner of the response
  const is_admin = await isAdmin(user.uid);
  if (user.uid != response.data.user_id && !is_admin)
    // Return a 403 error if the user is not authorized to delete the response
    return c.json({ error: "Forbidden" }, 403);

  // Delete the response from the database
  await config.supabaseClient
    .from("responses")
    .delete()
    .eq("id", id);

  // Return a 200 success response
  return c.json({ message: "Response deleted successfully" }, 200);
}

export default delete_response;