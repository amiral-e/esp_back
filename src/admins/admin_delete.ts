import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../config.ts";
import AdminMiddleware from "../middlewares/middleware_admin.ts";

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
								description: "The user ID to remove from admins",
								default: "123",
							},
						},
						required: ["user_id"],
					},
				},
			},
		},
		responses: {
			200: {
				description: "Successfully removed user from admins",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								message: {
									type: "string",
									description:
										"The message indicating that the user was removed from admins",
									default: "User removed from admins",
								},
							},
							required: ["message"],
						},
					},
				},
			},
			400: {
				description: "Invalid request",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								error: {
									type: "string",
									description: "The error message (one of the possible errors)",
									default: [
										"Invalid JSON",
										"You can't remove yourself from admins",
										"User is not an admin",
									],
								},
							},
							required: ["error"],
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
									description: "The error message (one of the possible errors)",
									default: [
										"No authorization header found",
										"Invalid authorization header",
										"You don't have admin privileges",
									],
								},
							},
							required: ["error"],
						},
					},
				},
			},
			404: {
				description: "User not found",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								error: {
									type: "string",
									description: "The error message (one of the possible errors)",
									default: ["Uid not found", "User not found"],
								},
							},
							required: ["error"],
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
									description: "The error message",
									default: "Internal server error",
								},
							},
							required: ["error"],
						},
					},
				},
			},
		},
	}),
	AdminMiddleware,
	async (c: any) => {
		const user = c.get("user");
		let json: any;
		try {
			json = await c.req.json();
			if (!json || json.user_id == undefined)
				return c.json({ error: "Invalid JSON" }, 400);
		} catch (error) {
			return c.json({ error: "Invalid JSON" }, 400);
		}

		if (user.uid == json.user_id)
			return c.json({ error: "You can't remove yourself from admins" }, 400);

		const { data, error } = await config.supabaseClient.rpc(
			"check_uid_exists",
			{
				user_id: json.user_id,
			},
		);
		if (data != undefined && data === false)
			return c.json({ error: "User not found" }, 404);
		else if (error) return c.json({ error: error.message }, 500);

		const { data: adminsData, error: adminsError } = await config.supabaseClient
			.from("admins")
			.select("*")
			.eq("user_id", json.user_id)
			.single();
		if (adminsData == undefined || adminsData.length == 0)
			return c.json({ error: "User is not an admin" }, 400);

		const { data: deletionData, error: deletionError } =
			await config.supabaseClient
				.from("admins")
				.delete()
				.eq("user_id", json.user_id)
				.select("*")
				.single();
		if (deletionError != undefined)
			return c.json({ error: deletionError.message }, 500);
		return c.json({ message: "User removed from admins" }, 200);
	},
);

export default admin_delete;
