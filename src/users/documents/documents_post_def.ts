import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import AuthMiddleware from "../../middlewares/auth.ts";
import post_documents from "./documents_post.ts";

const documents_post = new Hono();

documents_post.post(
	"/:collection_name/documents",
	describeRoute({
		summary: "Ingest documents",
		description:
			"Ingest documents in the specified collection. Auth is required.",
		tags: ["users-documents"],
		"multipart/form-data": {
			schema: {
				type: "object",
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
								message: {
									type: "string",
									default:
										"You have ingested X documents into the collection Y",
								},
							},
						},
					},
				},
			},
			400: {
				description: "Bad Request",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								error: {
									type: "string",
									default: [
										"Invalid JSON",
										"No files provided",
										"Please provide a single file at a time",
										"File size exceeds limit",
										"File type not allowed",
									],
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
			402: {
				description: "Payment Required",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								error: {
									type: "string",
									default: "Not enough credits",
								},
							},
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
									default: "Internal server error",
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
		return await post_documents(c);
	},
);

export default documents_post;
