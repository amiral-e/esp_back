import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../config.ts";
import AuthMiddleware from "../middlewares/middleware_auth.ts";

const categories_get = new Hono();

categories_get.get(
	"/",
	describeRoute({
		summary: "Get Categories",
		description: "Retrieves all categories from the database. Auth is not required.",
		tags: ["categories"],
		requestBody: {
			required: false,
			content: {},
		},
		responses: {
			200: {
				description: "Successfully retrieved categories",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								categories: {
									type: "array",
									items: {
										type: "object",
										properties: {
											id: {
												type: "string",
												description: "The ID of the category",
												default: "123",
											},
											name: {
												type: "string",
												description: "The name of the category",
												default: "Category 1",
											},
											description: {
												type: "string",
												description: "The description of the category",
												default: "Description of category 1",
											},
											created_at: {
												type: "string",
												description:
													"The date and time the category was created",
												default: "2023-01-01T00:00:00.000Z",
											},
										},
										required: ["id", "name", "description"],
									},
									description: "Array of category objects",
									required: true,
								},
							},
							required: ["categories"],
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
									],
								},
							},
							required: ["error"],
						},
					},
				},
			},
			404: {
				description: "No categories found",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								error: {
									type: "string",
									description: "The error message (one of the possible errors)",
									default: ["Uid not found", "No categories found"],
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
	async (c) => {
		const { data, error } = await config.supabaseClient
			.from("categories")
			.select("*");
		if (data == undefined || data.length == 0)
			return c.json({ error: "No categories found" }, 404);
		else if (error != undefined) return c.json({ error: error.message }, 500);
		return c.json({ categories: data }, 200);
	},
);

export default categories_get;
