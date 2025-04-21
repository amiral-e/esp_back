import { updateLevel } from "./utils.ts";

/**
 * Handles a PUT request to update a user's level.
 * 
 * @param c The request context.
 * @returns The response to the request.
 */
async function put_level(c: any) {
  // Retrieve the current user from the request context
  const user = c.get("user");
  // Check if the user has admin privileges, return Forbidden if not
  if (!user.admin) return c.json({ error: "Forbidden" }, 403);

  // Extract the user ID from the request parameters
  const { user_id } = await c.req.param();

  // Update the user's level using the utility function
  return await updateLevel(c, user_id);
}

export default put_level;