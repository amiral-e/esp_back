import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import AuthMiddleware from "../../middlewares/auth.ts";
import get_usage from "./usage_get.ts";

const usage_get = new Hono();

usage_get.get(
	describeRoute({
		summary: "Get Platform Usage",
		description: "Retrieves user's platform usage. Auth is required.",
		tags: ["users-profile"],
		responses: {
			200: {
				description: "Success",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {},
							required: [],
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
									default: "No usage found",
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
		return await get_usage(c);
	},
);

export default usage_get;
