import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../config.ts";
import AdminMiddleware from "../middlewares/middleware_admin.ts";

const admin_delete = new Hono();

admin_delete.delete(
	describeRoute({
		summary: 'Remove user from admins',
		description: 'This route removes a user from the admins list',
		tags: ['admins'],
		requestBody: {
			content: {
				'application/json': {
					schema: {
						type: 'object',
						properties: {
							user_id: {
								type: 'string',
								default: 'uid',
								description: 'The user id',
							},
						},
						required: ['user_id'],
					},
				},
			},
			required: true,
		},
		responses: {
			200: {
				description: 'OK',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								message: {
									type: 'string',
									default: 'User uid removed from admins',
									description: 'The message',
								},
							},
						},
					},
				},
			},
			400: {
				description: 'Bad request',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								error: {
									type: 'string',
									default: ['Invalid JSON', 'User is not an admin', 'You can\'t remove yourself from admins'],
									description: 'The error message (one of the possible errors)',
								},
							},
						},
					},
				},
			},
			401: {
				description: 'Unauthorized',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								error: {
									type: 'string',
									default: ['No authorization header found', 'Invalid authorization header', 'You don\'t have admin privileges'],
									description: 'The error message (one of the possible errors)',
								},
							},
						},
					},
				},
			},
			404: {
				description: 'Not found',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								error: {
									type: 'string',
									default: ['Uid not found', 'User not found'],
									description: 'The error message (one of the possible errors)',
								},
							},
						},
					},
				},
			},
			500: {
				description: 'Internal server error',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								error: {
									type: 'string',
									default: 'Internal server error',
									description: 'The error message',
								},
							},
						},
					},
				},
			},
		},
	}),
	AdminMiddleware, async (c: any) => {
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
			{ user_id: json.user_id },
		);
		if (data != undefined && data === false)
			return c.json({ error: "User not found" }, 404);
		else if (error)
			return c.json({ error: error.message }, 500);

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
		return c.json({ message: `User ${json.user_id} removed from admins` }, 200);
	});

export default admin_delete;
