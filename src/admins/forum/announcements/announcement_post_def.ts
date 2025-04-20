import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import AuthMiddleware from "../../../middlewares/auth";
import post_announcement from "./announcement_post";

const announcement_post = new Hono();

announcement_post.post(
	describeRoute({
		summary: "Create Announcement",
		description:
			"Creates a new announcement for the forum. Admin privileges are required.",
		tags: ["admins-forum-announcements"],
		requestBody: {
			required: true,
			content: {
				"application/json": {
					schema: {
						type: "object",
						properties: {
							message: {
								type: "string",
								description: "The message of the announcement",
								default: "New Announcement",
							},
						},
						required: ["message"],
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
									default: "Announcement created successfully",
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
		return await post_announcement(c);
	},
);

export default announcement_post;
