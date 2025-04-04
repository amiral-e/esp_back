import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../../config.ts";
import AuthMiddleware from "../../middlewares/auth.ts";

import { VectorStoreIndex } from "llamaindex";
import { decrease_credits } from "../profile/utils.ts";
import { get_report_prompt, process_query } from "./utils.ts";

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
			if (!json || json.title == undefined || json.documents == undefined || json.prompt == undefined || json.collection_name == undefined)
				return c.json({ error: "Invalid JSON" }, 400);
		} catch (error) {
			return c.json({ error: "Invalid JSON" }, 400);
		}
        var size = 0;
        for (doc of json.documents)
            size += doc.length;
		const input_tokens = size + json.prompt.length;

		const processed_query = await process_query(json.prompt);

		let texts = "";
		if (processed_query != "no search needed") {
			let docs = [];
			config.pgvs.setCollection(json.collection_name);
			const index = await VectorStoreIndex.fromVectorStore(config.pgvs);

			const retriever = index.asRetriever({
				similarityTopK: 3,
			});
			docs.push({
				collection_name: json.collection_name,
				sources: await retriever.retrieve({ query: processed_query }),
			});
			if (docs.length == 0) return c.json({ error: "No answer found" }, 404);

			for (const doc of docs) {
				texts += "collection: " + doc.collection_name + "\n\n";
				for (const source of doc.sources) {
					texts += source.node.metadata.doc_file + ":\n";
					// @ts-ignore
					texts += source.node.text + "\n\n";
				}
			}
		}
        
        const report_prompt = await get_report_prompt();
        var history = [{ role: "system", content: report_prompt }]

        var content = json.prompt
		if (texts != undefined && texts != "")
			content += `\n\nContext: ${texts}`
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