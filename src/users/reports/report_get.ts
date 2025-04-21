import config from "../../config.ts";

/**
 * Retrieves a report by ID.
 * 
 * @param {any} c - The controller object.
 * @returns {Promise<void>} A promise that resolves with the report data.
 */
async function get_report(c: any) {
	// Get the user object from the controller
	const user = c.get("user");
	
	// Extract the report ID from the request parameters
	const { report_id } = c.req.param();

	// Query the Supabase database for a report with the given ID and user ID
	const report = await config.supabaseClient
		.from("reports")
		.select("*")
		.eq("user_id", user.uid)
		.eq("id", report_id)
		.single();
	
	// Check if the report was found
	if (report.data == undefined || report.data.length == 0)
		// If not found, return a 404 error with a JSON response
		return c.json({ error: "Report not found" }, 404);

	// If the report was found, return its data as a JSON response
	return c.json(
		{
			title: report.data.title,
			text: report.data.text,
		},
		200,
	);
}

export default get_report;