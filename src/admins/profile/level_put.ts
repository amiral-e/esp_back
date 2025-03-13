import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../../config.ts";
import AuthMiddleware from "../../middlewares/auth.ts";

const level_put = new Hono();

level_put.put(
	"/:user_id/level",
	describeRoute({
		summary: "Update Level",
		description: "Updates user's knowledges level. Auth is required.",
		tags: ["admins-users-profile"],
		requestBody: {
			required: true,
			content: {
				"application/json": {
					schema: {
						type: "object",
						properties: {
							level: {
								type: "string",
								description: "The new knowledges level of the user.",
								default: "intermediate",
							},
						},
						required: ["level"],
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
									default: "Level updated successfully",
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
									default: ["Invalid JSON", "Invalid level"],
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
									default: ["No level found", "No profile found"],
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

		let json: any;
		try {
			json = await c.req.json();
			if (!json || json.level == undefined)
				return c.json({ error: "Invalid JSON" }, 400);
		} catch (error) {
			return c.json({ error: "Invalid JSON" }, 400);
		}

		const levels = await config.supabaseClient
			.from("knowledges")
			.select("id, level");
		if (levels.data == undefined || levels.data.length == 0)
			return c.json({ error: "No level found" }, 404);
		else if (levels.error != undefined)
			return c.json({ error: levels.error.message }, 500);

		if (!levels.data.some((level: any) => level.level == json.level))
			return c.json({ error: "Invalid level" }, 400);

		const profile = await config.supabaseClient
			.from("profiles")
			.select("*")
			.eq("id", user_id)
			.single();
		if (profile.data == undefined)
			return c.json({ error: "No profile found" }, 404);
		else if (profile.error != undefined)
			return c.json({ error: profile.error.message }, 500);

		const update = await config.supabaseClient
			.from("profiles")
			.update({ level: json.level })
			.eq("id", user_id)
			.single();
		if (update.error != undefined)
			return c.json({ error: update.error.message }, 500);

		return c.json({ message: "Level updated successfully" }, 200);
	},
);

export default level_put;
