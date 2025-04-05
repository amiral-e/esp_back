import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../../config.ts";
import AuthMiddleware from "../../middlewares/auth.ts";

const question_put = new Hono();

question_put.put(
	"/:question_id",
	describeRoute({
		summary: "Put predefined question",
		description: "Put predefined question by level. Admin privileges are required.",
		tags: ["admins-questions"],
		requestBody: {
			required: true,
			content: {
				"application/json": {
					schema: {
						type: "object",
						properties: {
							question: {
								type: "string",
								description: "The question to add in database",
								default: "",
							},
                            level: {
                                type: "string",
                                description: "The knowledge level of the question",
                                default: "beginner"
                            }
						},
						required: ["question", "level"],
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
									default: "Question updated successfully",
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
		if (!user.admin) return c.json({ error: "Forbidden" }, 403);

		const { question_id } = await c.req.param();

		let json: any;
		try {
			json = await c.req.json();
			if (json?.question == undefined || json?.level == undefined)
				return c.json({ error: "Invalid JSON" }, 400);
		} catch (error) {
			return c.json({ error: "Invalid JSON" }, 400);
		}

		const levels = await config.supabaseClient
			.from("prompts")
			.select("id, type")
			.eq("knowledge", true);
		if (levels.data == undefined || levels.data.length == 0)
			return c.json({ error: "No level found" }, 404);
		else if (levels.error != undefined)
			return c.json({ error: levels.error.message }, 500);

		if (!levels.data.some((level: any) => level.level == json.level))
			return c.json({ error: "Invalid level" }, 400);

		const result = await config.supabaseClient
			.from("questions")
			.update({ question: json.question, level: json.level })
			.eq("id", question_id)
			.single();
		if (result.error != undefined)
			return c.json({ error: result.error.message }, 500);

		return c.json({ message: "Question updated successfully" }, 200);
	},
);

export default question_put;