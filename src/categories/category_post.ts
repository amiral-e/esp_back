import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../config.ts";
import AdminMiddleware from "../middlewares/middleware_admin.ts";

const category_post = new Hono();

category_post.post("/",
	describeRoute({
		summary: "Create Category",
		description: "Creates a new category in the database. Admin privileges are required.",
		tags: ["categories"],
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
								default: "New Category"
							},
							description: {
								type: "string",
								description: "The description of the category",
								default: "Description of new category"
							}
						},
						required: ["name", "description"]
					}
				}
			}
		},
		responses: {
			200: {
				description: "Successfully created category",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								message: {
									type: "string",
									description: "The success message",
									default: "Category created successfully"
								}
							},
							required: ["message"]
						}
					}
				}
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
									description: "The error message",
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
									description: "The error message (one of the possible errors)",
									default: [
										"No authorization header found",
										"Invalid authorization header",
										"You don't have admin privileges"
									]
								}
							},
							required: ["error"]
						}
					}
				}
			},
			404: {
				description: "Not Found",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								error: {
									type: "string",
									description: "The error message",
									default: "Uid not found"
								}
							},
							required: ["error"]
						}
					}
				}
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
									default: "Internal server error"
								}
							},
							required: ["error"]
						}
					}
				}
			}
		}
	}),
	AdminMiddleware, async (c) => {
		let json: any;
		try {
			json = await c.req.json();
			if (!json || json.name == undefined || json.description == undefined)
				return c.json({ error: "Invalid JSON" }, 400);
		} catch (error) {
			return c.json({ error: "Invalid JSON" }, 400);
		}

		const { data, error } = await config.supabaseClient
			.from("categories")
			.insert(json)
			.select("*");
		if (error != undefined) return c.json({ error: error.message }, 500);
		return c.json({ message: 'Category created successfully' }, 200);
	});

export default category_post;
