import config from "../../config.ts";

async function get_report(c: any) {
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

	return c.json(
		{
			title: report.data.title,
			text: report.data.text,
		},
		200,
	);
}

export default get_report;