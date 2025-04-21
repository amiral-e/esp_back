import config from "../config.ts";

import { sign } from "hono/jwt";

/**
 * Retrieves user data from the database.
 * 
 * @param uid The user's unique ID.
 * @returns A promise that resolves to an object containing the user's validity and admin status.
 */
async function getUser(uid: string) {
  // Query the database to check if the user ID is valid
  const is_valid = await config.supabaseClient.rpc("is_valid_uid", {
    user_id: uid,
  });
  // If the query returns an error, default to invalid user
  if (is_valid.error) is_valid.data = false;

  // Query the database to check if the user is an admin
  const is_admin = await config.supabaseClient.rpc("is_admin_uid", {
    user_id: uid,
  });
  // If the query returns an error, default to non-admin user
  if (is_admin.error) is_admin.data = false;

  // Return an object with the user's validity and admin status
  return {
    valid: is_valid.data,
    admin: is_admin.data,
  };
}

/**
 * Generates a JSON Web Token (JWT) payload for the given user ID.
 * 
 * @param id The user's unique ID.
 * @returns A promise that resolves to the generated JWT token.
 */
async function generatePayload(id: string) {
  // Generate a JWT token using the user ID and the secret key
  const token = await sign({ uid: id }, config.envVars.JWT_SECRET);
  // Return the generated JWT token
  return token;
}

export { getUser, generatePayload };