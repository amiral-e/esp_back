import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../../config.ts";
import AuthMiddleware from "../../middlewares/auth.ts";

const profile_get = new Hono();

profile_get.get(
	"/:user_id/profile",
	describeRoute({
		summary: "Get profile",
		description: "Retrieve a user's profile. Admin privileges are required.",
		tags: ["admins-users-profile"],
		requestBody: {
			required: false,
			content: {},
		},
		responses: {
			200: {
				description: "Success",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								id: {
									type: "string",
									description: "The ID of the user",
									default: "123",
								},
								credits: {
									type: "float",
									description: "The credits of the user",
									default: 5,
								},
								level: {
									type: "string",
									description: "The knowledges level of the user",
									default: "intermediate",
								},
								created_at: {
									type: "string",
									description: "The date and time the user profile was created",
									default: "2023-01-01T00:00:00.000Z",
								},
							},
							required: ["id", "credits", "level"],
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
			404: {
				description: "Not found",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								error: {
									type: "string",
									default: "No profile found",
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

		const { user_id } = await c.req.param();

		const profile = await config.supabaseClient
			.from("profiles")
			.select("*")
			.eq("id", user_id)
			.single();
		if (profile.data == undefined)
			return c.json({ error: "No profile found" }, 404);

		return c.json({ profile: profile.data }, 200);
	},
);

export default profile_get;
