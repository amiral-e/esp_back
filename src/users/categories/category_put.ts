import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../../config.ts";
import AdminMiddleware from "../../middlewares/middleware_admin.ts";

const category_put = new Hono();

category_put.put("/:id",
	describeRoute({
		summary: "Update Category",
		description: "Updates a specific category in the database. Admin privileges are required.",
		tags: ["users-categories"],
		requestBody: {
			required: true,
			content: {
				"application/json": {
					schema: {
						type: "object",
						properties: {
							name: {
								type: "string",
								description: "The name of the category",
								default: "Updated Category"
							},
							description: {
								type: "string",
								description: "The description of the category",
								default: "Description of updated category"
							}
						},
						required: ["name", "description"]
					}
				}
			}
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
									default: "Category updated successfully"
								}
							},
							required: ["message"]
						}
					}
				}
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
									default: "Invalid JSON"
								}
							},
							required: ["error"]
						}
					}
				}
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
									],
								},
							},
							required: ["error"],
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
		}
	}),
	AdminMiddleware,
	async (c: any) => {
		const { id } = await c.req.param();
		let json: any;
		try {
			json = await c.req.json();
			if (!json || (json.name == undefined && json.description == undefined))
				return c.json({ error: "Invalid JSON" }, 400);
		} catch (error) {
			return c.json({ error: "Invalid JSON" }, 400);
		}

		const { data: categData, error: categError } = await config.supabaseClient
			.from("categories")
			.select("name")
			.eq("id", id)
			.single();
		if (categData == undefined || categData.length == 0)
			return c.json({ error: "Category not found" }, 404);
		else if (categError != undefined)
			return c.json({ error: categError.message }, 500);

		const { data: updateData, error: updateError } = await config.supabaseClient
			.from("categories")
			.update(json)
			.eq("id", id);
		if (updateError != undefined)
			return c.json({ error: updateError.message }, 500);

		return c.json({ message: 'Category updated successfully' }, 200);
	});

export default category_put;
