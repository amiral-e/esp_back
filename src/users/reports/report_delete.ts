import config from "../../config.ts";

/**
 * Deletes a report by ID.
 * 
 * @param {any} c - The controller object.
 * @returns {Promise<void>} A promise that resolves when the report is deleted.
 */
async function delete_report(c: any) {
  // Get the current user object from the controller
  const user = c.get("user");
  
  // Extract the report ID from the request parameters
  const { report_id } = c.req.param();

  // Query the reports table to find the report with the given ID and user ID
  const report = await config.supabaseClient
    .from("reports")
    .select("*")
    .eq("user_id", user.uid)
    .eq("id", report_id)
    .single();
  
  // Check if the report is found, if not return a 404 error
  if (report.data == undefined || report.data.length == 0)
    return c.json({ error: "Report not found" }, 404);

  // Delete the report from the database
  await config.supabaseClient
    .from("reports")
    .delete()
    .eq("id", report.data.id);

  // Return a success message with a 200 status code
  return c.json({ message: `Report deleted successfully` }, 200);
}

export default delete_report;