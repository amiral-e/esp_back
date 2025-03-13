import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../../config.ts";
import AuthMiddleware from "../../middlewares/auth.ts";

import { VectorStoreIndex } from "llamaindex";

import { add_context_to_query } from "./utils.ts";

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
	"/:conv_id/collections",
	describeRoute({
		summary: "Post a message to a collection conversation",
		description:
			"Posts a user message to a conversation using the context from one or more collections. It gets AI's response, and updates conversation history. Auth is required.",
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
								default: "Hello",
							},
							collections: {
								type: "array",
								items: {
									type: "string",
									description: "The ids of collections to use as context",
									default: "global_test",
								},
							},
						},
						required: ["message"],
					},
				},
			},
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
									default: "assistant",
								},
								content: {
									type: "string",
									description: "The response content",
									default: "Hello user, how can I help you?",
								},
								sources: {
									type: "array",
									description: "Sources used for the response",
									items: {
										type: "object",
										properties: {
											collection: {
												type: "string",
												description: "Collection used to retrieve documents",
												default: "global_test",
											},
											documents: {
												type: "array",
												description:
													"List of documents retrieved from the collection",
												items: {
													type: "string",
													default: "test.txt",
												},
											},
										},
									},
								},
							},
							required: ["role", "content"],
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
									default: ["Invalid JSON", "Invalid collection name"],
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
			404: {
				description: "Not found",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								error: {
									type: "string",
									default: ["Collection not found", "Conversation not found"],
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
			if (
				!json ||
				json.message == undefined ||
				json.message == "" ||
				json.collections == undefined ||
				json.collections.length == 0
			)
				return c.json({ error: "Invalid JSON" }, 400);
		} catch (error) {
			return c.json({ error: "Invalid JSON" }, 400);
		}

		const { conv_id } = c.req.param();
		for (const collec_name of json.collections) {
			if (
				!collec_name.startsWith("global_") &&
				!collec_name.startsWith(user.uid + "_")
			)
				return c.json({ error: "Invalid collection name" }, 400);
		}

		if (json.collections.length > 3)
			return c.json({ error: "Too many collections, 3 collections max" }, 400);

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

		const res = await add_context_to_query(
			conversation.data.history,
			json.message,
		);

		let docs = [];
		for (const collec_name of json.collections) {
			config.pgvs.setCollection(collec_name);
			const index = await VectorStoreIndex.fromVectorStore(config.pgvs);

			const retriever = index.asRetriever({
				similarityTopK: 3,
			});
			docs.push({
				collection_name: collec_name,
				sources: await retriever.retrieve({ query: res }),
			});
		}
		if (docs.length == 0) return c.json({ error: "No answer found" }, 404);

		let texts = "";
		for (const doc of docs) {
			texts += "collection: " + doc.collection_name + "\n\n";
			for (const source of doc.sources) {
				texts += source.node.metadata.doc_file + ":\n";
				// @ts-ignore
				texts += source.node.text + "\n\n";
			}
		}

		let response: any;
		try {
			response = await config.llm.chat({
				messages: [{ role: "user", content: get_context_prompt(texts, res) }],
			});
		} catch (error: any) {
			console.error(
				"LLM Error:",
				error instanceof Error ? error.message : error,
			);
			if (error.message?.toLowerCase().includes("rate_limit_exceeded"))
				console.log("Hit rate limit. Consider implementing retry logic.");
		}
		const increment_total_messages = await config.supabaseClient.rpc(
			"increment_total_messages",
			{ p_user_id: user.id },
		);
		if (increment_total_messages.error != undefined)
			return c.json({ error: increment_total_messages.error.message }, 500);

		let sources_details = [];
		for (const doc of docs) {
			const details = doc.sources.map((x: any) => {
				return {
					part: x.node.id_,
					metadata: x.node.metadata,
					score: x.score,
				};
			});
			sources_details.push({
				collection: doc.collection_name,
				documents: details,
			});
		}

		let source_save = [];
		for (const source of sources_details) {
			source_save.push({
				collection: source.collection,
				documents: source.documents.map((x) => x.metadata.doc_file),
			});
		}

		conversation.data.history.push({ role: "user", content: json.message });
		conversation.data.history.push({
			role: "assistant",
			content: response.message.content,
			sources: source_save,
		});

		const update = await config.supabaseClient
			.from("conversations")
			.update({ history: conversation.data.history })
			.eq("id", conversation.data.id);
		if (update.error) return c.json({ error: update.error.message }, 500);

		return c.json(
			{
				role: "assistant",
				content: response.message.content,
				sources: sources_details,
			},
			200,
		);
	},
);

export default chat_collection_post;
