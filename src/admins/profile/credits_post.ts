import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../../config.ts";
import AuthMiddleware from "../../middlewares/auth.ts";

const credits_post = new Hono();

credits_post.post(
	"/:user_id/grant",
	describeRoute({
		summary: "Grant Credits",
		description:
			"Grant credits to a user. Admin privileges are required.",
		tags: ["admins-users-profile"],
		requestBody: {
			required: true,
			content: {
				"application/json": {
					schema: {
						type: "object",
						properties: {
							credits: {
								type: "integer",
								description: "The number of credits to grant",
								default: 5,
							},
						},
						required: ["credits"],
					},
				},
			},
		},
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
									default: "Credits granted successfully",
								},
							},
							required: ["message"],
						},
					},
				},
			},
			400: {
				description: "Bad request",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								error: {
									type: "string",
									default: "Invalid JSON",
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
		if (!user.admin)
			return c.json({ error: "Forbidden" }, 403);

		const { user_id } = await c.req.param();

		let json: any;
		try {
			json = await c.req.json();
			if (!json || json.credits == undefined)
				return c.json({ error: "Invalid JSON" }, 400);
		} catch (error) {
			return c.json({ error: "Invalid JSON" }, 400);
		}

		const credits = await config.supabaseClient
			.from("profiles")
			.select("credits")
			.eq("id", user_id)
			.single();
		if (credits.error != undefined)
			return c.json({ error: credits.error.message }, 500);

		const update = await config.supabaseClient
			.from("profiles")
			.update({ credits: credits.data.credits + json.credits })
			.eq("id", user_id);
		if (update.error != undefined)
			return c.json({ error: update.error.message }, 500);

		return c.json({ message: "Credits granted successfully" }, 200);
	},
);

export default credits_post;
