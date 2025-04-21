/**
 * Retrieves and returns user information.
 * 
 * @param {any} c - The request context.
 * @returns {Promise<any>} A JSON response containing the user information.
 */
async function get_user(c: any) {
	// Retrieve the user from the request context
	const user = c.get("user");
	
	// Construct a JSON response containing the user information and a message
	return c.json({
	  message: "Here is your infos",
	  user: user,
	});
  }
  
  export default get_user;