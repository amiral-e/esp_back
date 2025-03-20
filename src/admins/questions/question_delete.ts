import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../../config.ts";
import AuthMiddleware from "../../middlewares/auth.ts";

const question_delete = new Hono();

question_delete.delete(
    "/:question_id",
	describeRoute({
		summary: "Delete question",
		description:
			"Delete a question from the database. Admin privileges are required.",
		tags: ["admins-questions"],
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
									default: "Question deleted successfully",
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
		const user = c.get("user");
		if (!user.admin) return c.json({ error: "Forbidden" }, 403);

		const { question_id } = c.req.param();

        const question = await config.supabaseClient
            .from("questions")
            .select("*")
            .eq("id", question_id)
            .single();
        if (question.data == undefined)
            return c.json({ error: "Question not found" }, 404);
        if (question.error != undefined)
            return c.json({ error: question.error.message }, 500);

		const deletion = await config.supabaseClient
			.from("questions")
			.delete()
			.eq("id", question_id)
			.select("*")
			.single();
		if (deletion.error != undefined)
			return c.json({ error: deletion.error.message }, 500);
		return c.json({ message: "Question deleted successfully" }, 200);
	},
);

export default question_delete;