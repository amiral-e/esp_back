import config from "../../config.ts";

/**
 * Retrieves reports for a given user.
 * 
 * @param c The context object containing the user information.
 * @returns A JSON response with the report data or an error message.
 */
async function get_reports(c: any) {
	const user = c.get("user");

	const reports = await config.supabaseClient
		.from("reports")
		.select("title, id")
		.eq("user_id", user.uid);
	if (reports.data == undefined || reports.data.length == 0)
		return c.json({ error: "No report found" }, 404);

	return c.json(reports.data, 200);
}

export default get_reports;
