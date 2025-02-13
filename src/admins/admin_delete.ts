import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../config.ts";
import AuthMiddleware from "../middlewares/auth.ts";

import { getUser } from "../middlewares/utils.ts";

const admin_delete = new Hono();

admin_delete.delete(
	describeRoute({
		summary: "Remove Admin",
		description: "Removes a user from the admins list. Admin privileges are required.",
		tags: ["admins"],
		requestBody: {
			required: true,
			content: {
				"application/json": {
					schema: {
						type: "object",
						properties: {
							user_id: {
								type: "string",
								description: "The ID of the user to remove from the admins list.",
								default: "80c3da89-a585-4876-aa94-d1588d50ceb4",
							},
						},
						required: ["user_id"],
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
									default: "User removed from admins",
								},
							},
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
									default: [
										"Invalid JSON",
										"You can't remove yourself from admins",
										"User is not an admin",
									],
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
									default: ["No authorization header found", "Invalid authorization header", "Invalid user"],
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
			404: {
				description: "Not found",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								error: {
									type: "string",
									default: "User not found",
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

		let request_uid = "";
		try {
			const json = await c.req.json();
			if (!json || !json.user_id || typeof json.user_id !== "string")
				throw new Error();
			request_uid = json.user_id;
		} catch (error) {
			return c.json({ error: "Invalid JSON" }, 400);
		}

		if (user.uid == request_uid)
			return c.json({ error: "You can't remove yourself from admins" }, 400);

		const request_user = await getUser(request_uid);
		if (!request_user || !request_user.valid)
			return c.json({ error: "User not found" }, 404);
		else if (!request_user.admin)
			return c.json({ error: "User is not an admin" }, 400);

		const deletion =
			await config.supabaseClient
				.from("admins")
				.delete()
				.eq("uid", request_uid)
				.select("*")
				.single();
		if (deletion.error != undefined)
			return c.json({ error: deletion.error.message }, 500);
		return c.json({ message: "User removed from admins" }, 200);
	},
);

export default admin_delete;
