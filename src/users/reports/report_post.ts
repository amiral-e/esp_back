import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../../config.ts";
import AuthMiddleware from "../../middlewares/auth.ts";

import { decrease_credits } from "../profile/utils.ts";
import { get_report_prompt } from "./utils.ts";

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
						},
						required: ["title", "context", "prompt"],
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
		let json: any;

		try {
			json = await c.req.json();
			if (!json || json.title == undefined || json.documents == undefined || json.prompt == undefined)
				return c.json({ error: "Invalid JSON" }, 400);
		} catch (error) {
			return c.json({ error: "Invalid JSON" }, 400);
		}
        var size = 0;
        for (doc of json.documents)
            size += doc.length;
		const input_tokens = size + json.prompt.length;
        
        const report_prompt = await get_report_prompt();
		console.log(report_prompt);
        var history = [{ role: "system", content: report_prompt }]

        var content = json.prompt
        for (var i = 0; i < json.documents.length; i++) {
            var doc = json.documents[i]
            content += `\n\nDoc ${i+1}: ` + doc
        }
        history.push({ role: "user", content: content })
        
		let response: any;
		try {
			response = await config.llm.chat({
				messages: JSON.parse(JSON.stringify(history)),
			});
		} catch (error: any) {
			console.error(
				"LLM Error:",
				error instanceof Error ? error.message : error,
			);
			if (error.message?.toLowerCase().includes("rate_limit_exceeded")) {
				console.log("Hit rate limit. Consider implementing retry logic.");
				return c.json({ error: "Rate limit exceeded" }, 500);
			}
			return c.json({ error: "Failed to process message" }, 500);
		}

		const result = await config.supabaseClient
			.from("reports")
			.insert({ user_id: user.uid, title: json.title, text: response.message.content });
		if (result.error) return c.json({ error: result.error.message }, 500);

		const increment_total_reports = await config.supabaseClient.rpc(
			"increment_total_reports",
			{ p_user_id: user.uid },
		);
		if (increment_total_reports.error != undefined)
			return c.json({ error: increment_total_reports.error.message }, 500);

		const input_results = await decrease_credits(input_tokens, user.uid, "groq_input");
		if (input_results != "Success")
			return c.json({ error: input_results }, 500);

		const output_results = await decrease_credits(response.message.content.length, user.uid, "groq_output");
		if (output_results != "Success")
			return c.json({ error: output_results }, 500);

		return c.json(
			{ title: json.title, text: response.message.content },
			200,
		);
	},
);

export default report_post;