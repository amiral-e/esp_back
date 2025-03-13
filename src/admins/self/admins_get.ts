import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../../config.ts";
import AuthMiddleware from "../../middlewares/auth.ts";

const admins_get = new Hono();

admins_get.get(
	describeRoute({
		summary: "Get Admins",
		description: "Retrieve admins list. Admin privileges are required.",
		tags: ["admins"],
		responses: {
			200: {
				description: "Success",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								admins: {
									type: "array",
									items: {
										type: "object",
										properties: {
											uid: { type: "string", format: "uuid" },
											email: { type: "string" },
										},
									},
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
			403: {
				description: "Forbidden",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								error: {
									type: "string",
									default: "Forbidden",
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
		if (!user.admin) return c.json({ error: "Forbidden" }, 403);

		const admins = await config.supabaseClient.from("admins").select("uid");
		if (admins.error != undefined)
			return c.json({ error: admins.error.message }, 500);

		for (let i = 0; i < admins.data.length; i++) {
			const email = await config.supabaseClient.rpc("get_email", {
				user_id: admins.data[i].uid,
			});
			if (email.error != undefined)
				return c.json({ error: email.error.message }, 500);
			admins.data[i].email = email.data;
		}
		return c.json({ admins: admins.data }, 200);
	},
);

export default admins_get;
