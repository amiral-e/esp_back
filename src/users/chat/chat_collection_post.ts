import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../../config.ts";
import AuthMiddleware from "../../middlewares/middleware_auth.ts";

import {
	VectorStoreIndex,
} from "llamaindex";

import add_context_to_query from "./utils.ts";

const chat_collection_post = new Hono();

function get_context_prompt(texts: string, query: string): string {
	const context_prompt = `Context information is below.
---------------------
${texts}
---------------------
Given the context information and not prior knowledge, answer the query.
Your answer should be in the same language as the query.
You can't return the full context directly, but you can summarize it, or use it to answer the query.

Query: ${query}
Answer:`;

	return context_prompt;
}

chat_collection_post.post(
	"/conversations/:conv_id/collections/:collec_name",
	describeRoute({
		summary: "Post a message to a collection conversation",
		description: "Posts a user message to a specific collection conversation, gets AI response, and updates conversation history. Auth is required.",
		tags: ["users-chat"],
		requestBody: {
			required: true,
			content: {
				"application/json": {
					schema: {
						type: "object",
						properties: {
							message: {
								type: "string",
								description: "The message to be sent in the conversation",
								default: "Hello"
							}
						},
						required: ["message"]
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
								role: {
									type: "string",
									description: "The role of the responder",
									default: "assistant"
								},
								content: {
									type: "string",
									description: "The response content",
									default: "Hello user, how can I help you?"
								},
								sources: {
									type: "array",
									description: "Sources used for the response"
								}
							},
							required: ["role", "content"]
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
									default: ["Invalid JSON", "Invalid collection name"]
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
			404: {
				description: "Not found",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								error: {
									type: "string",
									default: ["Collection not found", "Conversation not found"]
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
									default: "Error message",
								},
							},
						},
					},
				},
			},
		}
	}),
	AuthMiddleware,
	async (c: any) => {
		const user = c.get("user");
		let json: any;

		try {
			json = await c.req.json();
			if (!json || json.message == undefined || json.message == "")
				return c.json({ error: "Invalid JSON" }, 400);
		} catch (error) {
			return c.json({ error: "Invalid JSON" }, 400);
		}
		const { conv_id, collec_name } = c.req.param();
		if (
			!collec_name.startsWith("global_") &&
			!collec_name.startsWith(user.uid + "_")
		)
			return c.json({ error: "Invalid collection name" }, 400);

		const conversation = await config.supabaseClient
			.from("conversations")
			.select("*")
			.eq("user_id", user.uid)
			.eq("id", conv_id)
			.single();
		if (conversation.data == undefined || conversation.data.length == 0)
			return c.json({ error: "Conversation not found" }, 404);
		else if (conversation.error)
			return c.json({ error: conversation.error.message }, 500);

		const res = await add_context_to_query(conversation.data.history, json.message);

		config.pgvs.setCollection(collec_name);
		const index = await VectorStoreIndex.fromVectorStore(config.pgvs);

		const retriever = index.asRetriever({
			similarityTopK: 3,
		});
		const docs = await retriever.retrieve({ query: res });
		if (docs.length == 0)
			return c.json({ error: "No answer found" }, 404);

		let texts = '';
		for (const doc of docs) {
			texts += doc.node.metadata.doc_file;
			texts += ': ';
			// @ts-ignore
			texts += doc.node.text;
			texts += '\n';
		}

		let response: any;
		try {
			response = await config.llm.chat({ 'messages': [{ role: 'user', content: get_context_prompt(texts, res) }] });
			console.log(response.message.content);
		} catch (error: any) {
			console.error("LLM Error:", error instanceof Error ? error.message : error);
			if (error.message?.toLowerCase().includes("rate_limit_exceeded"))
				console.log("Hit rate limit. Consider implementing retry logic.");
		}

		const sources_details = docs.map((x: any) => {
			return {
				part: x.node.id_,
				metadata: x.node.metadata,
				score: x.score,
			};
		});
		const sources = [...new Set(sources_details.map((x: any) => {
			return x.metadata.doc_file;
		}))];

		conversation.data.history.push({ role: "user", content: json.message });
		conversation.data.history.push({ role: "assistant", content: response.message.content, sources: sources });

		const { data: updateData, error: updateError } = await config.supabaseClient
			.from("conversations")
			.update({ history: conversation.data.history })
			.eq("id", conversation.data.id);
		if (updateError)
			return c.json({ error: updateError.message }, 500);

		return c.json(
			{ role: "assistant", content: response.message.content, sources: sources_details },
			200,
		);
	},
);

export default chat_collection_post;
