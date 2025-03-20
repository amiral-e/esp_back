import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../../config.ts";
import AuthMiddleware from "../../middlewares/auth.ts";

const questions_get = new Hono();

questions_get.get(
	describeRoute({
		summary: "Get questions",
		description:
			"Retrieve predefined questions from the database. Auth is required.",
		tags: ["users-questions"],
		responses: {
			200: {
				description: "Success",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								questions: {
									type: "array",
									items: {
										type: "object",
										properties: {
											question: {
												type: "string",
												default: "",
											},
										},
									},
								},
							},
							required: ["questions"],
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
			404: {
				description: "Not found",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								error: {
									type: "string",
									default: "No question found",
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

        const profile = await config.supabaseClient
            .from("profiles")
            .select("level")
            .eq("id", user.uid)
            .single();
        if (profile.error != undefined)
            return c.json({ error: profile.error.message }, 500);

		const questions = await config.supabaseClient
			.from("questions")
			.select("question")
            .eq("level", profile.data.level);
		if (questions.data == undefined || questions.data.length == 0)
			return c.json({ error: "No questions found" }, 404);
		else if (questions.error != undefined)
			return c.json({ error: questions.error.message }, 500);

		return c.json({ questions: questions.data.map((l: any) => l.question) }, 200);
	},
);

export default questions_get;