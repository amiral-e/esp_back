import config from "../../config.ts";

/**
 * Retrieves reports for a given user.
 * 
 * @param c The context object containing the user information.
 * @returns A JSON response with the report data or an error message.
 */
async function get_reports(c: any) {
  // Retrieve the user object from the context
  const user = c.get("user");

  // Query the Supabase database for reports belonging to the current user
  const reports = await config.supabaseClient
    .from("reports")
    .select("title, id")
    .eq("user_id", user.uid);
  
  // Check if the query returned any reports
  if (reports.data == undefined || reports.data.length == 0)
    // If no reports were found, return a 404 error response
    return c.json({ error: "No report found" }, 404);

  // If reports were found, return a 200 response with the report data
  return c.json(reports.data, 200);
}

export default get_reports;