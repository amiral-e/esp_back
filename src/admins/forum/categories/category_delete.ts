import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../../../config.ts";
import AuthMiddleware from "../../../middlewares/auth.ts";

const category_delete = new Hono();

category_delete.delete(
	"/:id",
	describeRoute({
		summary: "Delete Category",
		description:
			"Deletes a specific category from the database. Admin privileges are required.",
		tags: ["admins-forum-categories"],
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
									default: "Category deleted successfully",
								},
							},
							required: ["message"],
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
									default: "Category not found",
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
		return await delete_category(c);
	},
);

async function delete_category(c: any) {
	const user = c.get("user");
	if (!user.admin) return c.json({ error: "Forbidden" }, 403);

	const { id } = await c.req.param();

	const categories = await config.supabaseClient
		.from("categories")
		.select("*")
		.eq("id", id)
		.single();
	if (categories.data == undefined || categories.data.length == 0)
		return c.json({ error: "Category not found" }, 404);

	await config.supabaseClient
		.from("categories")
		.delete()
		.eq("id", id)
		.select("*");

	return c.json({ message: "Category deleted successfully" }, 200);
}

export default category_delete;
