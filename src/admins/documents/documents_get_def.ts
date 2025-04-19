import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import AuthMiddleware from "../../middlewares/auth.ts";
import get_documents from "./documents_get.ts";

const documents_get = new Hono();

documents_get.get(
	"/:collection_name/documents",
	describeRoute({
		summary: "Get documents",
		description:
			"Get a list of documents in the specified collection. Admin privileges are required.",
		tags: ["admins-documents"],
		responses: {
			200: {
				description: "Success",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								documents: {
									type: "array",
									items: {
										type: "object",
										properties: {
											doc_id: {
												type: "string",
												default: "0194ec0d-4975-7000-8f3b-cde53ce18ef8",
											},
											doc_file: { type: "string", default: "example.md" },
										},
									},
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
									default: "Collection not found",
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
		return await get_documents(c);
	},
);

export default documents_get;
