import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../../config";
import AuthMiddleware from "../../middlewares/auth.ts";

const report_delete = new Hono();

report_delete.delete(
	"/:report_id",
	describeRoute({
		summary: "Delete a report by ID",
		description:
			"Deletes a specific report for the authenticated user. Auth is required.",
		tags: ["users-reports"],
		responses: {
			200: {
				description: "Success",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								message: {
									type: "string",
									example: "Report deleted successfully",
								},
							},
						},
					},
				},
			},
			401: {
				description: "Unauthorized",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								error: {
									type: "string",
									default: [
										"No authorization header found",
										"Invalid authorization header",
										"Invalid user",
									],
								},
							},
						},
					},
				},
			},
			404: {
				description: "Not found",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								error: {
									type: "string",
									default: "Report not found",
								},
							},
						},
					},
				},
			},
			500: {
				description: "Internal server error",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								error: {
									type: "string",
									default: "Error message",
								},
							},
						},
					},
				},
			},
		},
	}),
	AuthMiddleware,
	async (c: any) => {
		return await delete_report(c);
	},
);

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

	const deletion = await config.supabaseClient
		.from("reports")
		.delete()
		.eq("id", report.data.id);

	return c.json({ message: `Report deleted successfully` }, 200);
}

export default report_delete;