import config from "../config.ts";

/**
 * Checks if a user is an administrator.
 * 
 * @param id The ID of the user to check.
 * @returns A boolean indicating whether the user is an administrator.
 */
async function isAdmin(id: string) {
  // Query the 'admins' table in the database for a user with the given ID
  const { data } = await config.supabaseClient
    .from("admins")
    .select("*")
    .eq("uid", id)
    .single();
  // Return true if a matching user is found, false otherwise
  return data != undefined;
}

/**
 * Inserts a new administrator into the database.
 * 
 * @param id The ID of the user to insert as an administrator.
 */
async function insertAdmin(id: string) {
  // First, check if the user is already an administrator
  if (await isAdmin(id)) return;
  // If not, insert the user into the 'admins' table
  const { error } = await config.supabaseClient
    .from("admins")
    .insert({ uid: id })
    .select("*")
    .single();
  // If an error occurs during the insertion, log the error message
  if (error != undefined) console.error(error.message);
}

/**
 * Deletes an administrator from the database.
 * 
 * @param id The ID of the administrator to delete.
 */
async function deleteAdmin(id: string) {
  // First, check if the user is actually an administrator
  if (!(await isAdmin(id))) return;
  // If so, delete the user from the 'admins' table
  const { error } = await config.supabaseClient
    .from("admins")
    .delete()
    .eq("uid", id)
    .select("*")
    .single();
  // If an error occurs during the deletion, log the error message
  if (error != undefined) console.error(error.message);
}

export { isAdmin, insertAdmin, deleteAdmin };