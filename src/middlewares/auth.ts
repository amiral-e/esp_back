import { verify } from "hono/jwt";
import config from "../config.ts";
import { getUser } from "./utils.ts";

/**
 * Authentication middleware function.
 * Verifies the authorization header and sets the user data in the context.
 * 
 * @param c The context object.
 * @param next The next middleware function.
 * @returns A promise that resolves to the next middleware function.
 */
const AuthMiddleware = async (c: any, next: any) => {
  // Extract the authorization header from the request
  const { authorization } = c.req.header();
  // Check if the authorization header is present
  if (!authorization)
    // If not, return a 401 response with an error message
    return c.json({ error: "No authorization header found" }, 401);

  // Remove the 'Bearer ' prefix from the authorization header
  const bearer = authorization.replace("Bearer ", "");
  let uid = "";

  try {
    // Attempt to verify the JWT token
    const decoded = await verify(bearer, config.envVars.JWT_SECRET);
    // Check if the decoded token contains a valid uid
    if (!decoded?.uid || typeof decoded.uid !== "string")
      // If not, return a 401 response with an error message
      return c.json({ error: "Invalid authorization header" }, 401);
    // Extract the uid from the decoded token
    uid = decoded["uid"];
  } catch (error) {
    // If the verification fails, return a 401 response with an error message
    return c.json({ error: "Invalid authorization header" }, 401);
  }
  // Retrieve the user data using the extracted uid
  const user = await getUser(uid);
  // Check if the user data is valid
  if (!user.valid) 
    // If not, return a 401 response with an error message
    return c.json({ error: "Invalid user" }, 401);

  // Set the user data in the context
  c.set("user", {
    uid: uid,
    admin: user.admin,
  });
  // Proceed to the next middleware function
  return next();
};

export default AuthMiddleware;