import config from "../../config.ts";

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
