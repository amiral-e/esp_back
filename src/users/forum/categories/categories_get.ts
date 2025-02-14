import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../../../config.ts";
import AuthMiddleware from "../../../middlewares/auth.ts";

const categories_get = new Hono();

categories_get.get(
	describeRoute({
		summary: "Get Categories",
		description:
			"Retrieves all categories from the database. Auth is not required.",
		tags: ["users-forum-categories"],
		requestBody: {
			required: false,
			content: {},
		},
		responses: {
			200: {
				description: "Success",
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
			404: {
				description: "Not found",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								error: {
									type: "string",
									default: "No category found",
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
		const categories = await config.supabaseClient
			.from("categories")
			.select("*");
		if (categories.data == undefined || categories.data.length == 0)
			return c.json({ error: "No categories found" }, 404);
		else if (categories.error != undefined)
			return c.json({ error: categories.error.message }, 500);

		return c.json({ categories: categories.data }, 200);
	},
);

export default categories_get;
