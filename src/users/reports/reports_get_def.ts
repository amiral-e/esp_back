import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import AuthMiddleware from "../../middlewares/auth.ts";
import get_reports from "./reports_get.ts";

const reports_get = new Hono();

reports_get.get(
	"/",
	describeRoute({
		summary: "Get all user's reports",
		description:
			"Returns the details of reports for the authenticated user. Auth is required.",
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
								id: {
									type: "string",
									description: "The id of the report",
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
									default: "No report found",
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
		return await get_reports(c);
	},
);

export default reports_get;
