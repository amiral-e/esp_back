import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import AuthMiddleware from "../../../middlewares/auth.ts";
import delete_response from "./response_delete.ts";

const response_delete = new Hono();

response_delete.delete(
	"/:id",
	describeRoute({
		summary: "Delete a response",
		description:
			"Delete a response by ID. Users can delete their own responses. Administrators can delete any response.",
		tags: ["users-forum-responses"],
		parameters: [
			{
				name: "id",
				in: "path",
				description: "Response ID",
				required: true,
				schema: {
					type: "string",
				},
			},
		],
		responses: {
			200: {
				description: "OK",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								message: {
									type: "string",
									default: "Response deleted successfully",
									description: "Success message",
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
									default: "Not authorized to delete this response",
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
				description: "Not Found",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								error: {
									type: "string",
									default: "Response not found",
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
		return await delete_response(c);
	},
);

export default response_delete;
