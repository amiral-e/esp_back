import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import AuthMiddleware from "../../middlewares/auth.ts";
import post_report from "./report_post.ts";

const report_post = new Hono();

report_post.post(
	describeRoute({
		summary: "Post a report",
		description:
			"Generate a report using AI then posts it to the user's report history. Auth is required.",
		tags: ["users-reports"],
		requestBody: {
			required: true,
			content: {
				"application/json": {
					schema: {
						type: "object",
						properties: {
							title: {
								type: "string",
								description: "The title of the report",
								default: "Titre du rapport",
							},
                            documents: {
                                type: "array",
                                items: {
									type: "string",
									description: "The documents texts used as context",
									default: "",
								},
                            },
                            prompt: {
                                type: "string",
                                description: "The prompt used to generate the report",
                                default: "Génère un rapport",
                            },
							collection_name: {
								type: "string",
								description: "The name of the collection to use as context",
								default: "",
							},
						},
						required: ["title", "documents", "prompt", "collection_name"],
					},
				},
			},
		},
		responses: {
			200: {
				description: "Sucess",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								title: {
									type: "string",
									description: "The title of the report",
									default: "Report title",
								},
								text: {
									type: "string",
									description: "The report text",
									default: "Report text",
								},
							},
							required: ["title", "text"],
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
									default: ["Invalid JSON"],
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
			402: {
				description: "Payment Required",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								error: {
									type: "string",
									default: "Not enough credits",
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
		return await post_report(c);
	},
);

export default report_post;
