import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import config from "../../../config";

const announcements_get = new Hono();

announcements_get.get(
	"/",
	describeRoute({
		summary: "Get announcements",
		description:
			"Retrieve all announcements from the forum. Auth is not required.",
		tags: ["users-forum-announcements"],
		requestBody: {
			required: false,
			content: {},
		},
		responses: {
			200: {
				description: "Successfully retrieved announcements",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								announcements: {
									type: "array",
									items: {
										type: "object",
										properties: {
											id: {
												type: "string",
												description: "Announcement ID",
												default: "123",
											},
											message: {
												type: "string",
												description: "Announcement message",
												default: "Welcome to our forum!",
											},
											created_at: {
												type: "string",
												description: "Announcement creation date and time",
												default: "2023-04-15T12:00:00Z",
											},
										},
									},
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
									default: "No announcement found",
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
	async (c) => {
		return await get_announcements(c);
	},
);

async function get_announcements(c: any) {
	const announcements = await config.supabaseClient
		.from("announcements")
		.select("*");

	if (announcements.data == undefined || announcements.data.length == 0)
		return c.json({ error: "No announcement found" }, 404);

	return c.json({ announcements: announcements.data }, 200);
}

export default announcements_get;
