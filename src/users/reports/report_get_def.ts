import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import AuthMiddleware from "../../middlewares/auth.ts";
import get_report from "./report_get.ts";

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
		return await get_report(c);
	},
);

export default report_get;
