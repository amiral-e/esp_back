import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../config.ts";
import AdminMiddleware from "../middlewares/middleware_admin.ts";

const category_delete = new Hono();

category_delete.delete(
	"/:id",
	describeRoute({
		summary: "Delete Category",
		description: "Deletes a specific category from the database. Admin privileges are required.",
		tags: ["categories"],
		responses: {
			200: {
				description: "Successfully deleted category",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								message: {
									type: "string",
									description: "The success message",
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
									description: "The error message (one of the possible errors)",
									default: [
										"No authorization header found",
										"Invalid authorization header",
										"You don't have admin privileges",
									],
								},
							},
							required: ["error"],
						},
					},
				},
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
									description: "The error message (one of the possible errors)",
									default: ["Uid not found", "Category not found"],
								},
							},
							required: ["error"],
						},
					},
				},
			},
			500: {
				description: "Internal Server Error",
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
	AdminMiddleware,
	async (c: any) => {
		const { id } = await c.req.param();

		const { data: categData, error: categError } = await config.supabaseClient
			.from("categories")
			.select("*")
			.eq("id", id)
			.single();
		if (categData == undefined || categData.length == 0)
			return c.json({ error: "Category not found" }, 404);
		if (categError != undefined)
			return c.json({ error: categError.message }, 500);

		const { data: delData, error: delError } = await config.supabaseClient
			.from("categories")
			.delete()
			.eq("id", id)
			.select("*");
		if (delError != undefined) return c.json({ error: delError.message }, 500);
		return c.json({ message: "Category deleted successfully" }, 200);
	},
);

export default category_delete;
