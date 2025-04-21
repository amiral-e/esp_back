import config from "../../config.ts";

/**
 * Deletes a report by ID.
 * 
 * @param {any} c - The controller object.
 * @returns {Promise<void>} A promise that resolves when the report is deleted.
 */
async function delete_report(c: any) {
	const user = c.get("user");
	const { report_id } = c.req.param();

	const report = await config.supabaseClient
		.from("reports")
		.select("*")
		.eq("user_id", user.uid)
		.eq("id", report_id)
		.single();
	if (report.data == undefined || report.data.length == 0)
		return c.json({ error: "Report not found" }, 404);

	await config.supabaseClient
		.from("reports")
		.delete()
		.eq("id", report.data.id);

	return c.json({ message: `Report deleted successfully` }, 200);
}

export default delete_report;
