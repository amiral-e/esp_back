import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../../config.ts";
import AuthMiddleware from "../../middlewares/auth.ts";

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
		const user = c.get("user");

		const usage = await config.supabaseClient
			.from("usage")
			.select("month, used_credits, total_messages, total_docs, total_reports")
			.eq("user_id", user.uid);
		if (usage.data == undefined)
			return c.json({ error: "No usage found" }, 404);
		else if (usage.error != undefined)
			return c.json({ error: usage.error.message }, 500);

		return c.json({ usage: usage.data }, 200);
	},
);

export default usage_get;
