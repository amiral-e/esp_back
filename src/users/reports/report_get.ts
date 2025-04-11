import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../../config.ts";
import AuthMiddleware from "../../middlewares/auth.ts";

const report_get = new Hono();

report_get.get(
	"/:report_id",
	describeRoute({
		summary: "Get a single report by ID",
		description:
			"Returns the details of a single report for the authenticated user. Auth is required.",
		tags: ["users-reports"],
		responses: {
			200: {
				description: "Successfully retrieved report",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								title: {
									type: "string",
									description: "The title of the report",
									default: "My report",
								},
								text: {
									type: "string",
									description: "The text of the report",
									default: "This is my report",
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
		else if (report.error != undefined)
			return c.json({ error: report.error.message }, 500);

		return c.json(
			{
				title: report.data.title,
				text: report.data.text,
			},
			200,
		);
	},
);

export default report_get;