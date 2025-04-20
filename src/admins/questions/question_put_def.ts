import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import AuthMiddleware from "../../middlewares/auth.ts";
import put_question from "./question_put.ts";

const question_put = new Hono();

question_put.put(
	"/:question_id",
	describeRoute({
		summary: "Put predefined question",
		description:
			"Put predefined question by level. Admin privileges are required.",
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
								default: "beginner",
							},
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
			404: {
				description: "Not found",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								error: {
									type: "string",
									default: "Question not found",
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
		return await put_question(c);
	},
);

export default question_put;
