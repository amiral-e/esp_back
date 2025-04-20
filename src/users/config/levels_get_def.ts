import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import AuthMiddleware from "../../middlewares/auth.ts";
import get_levels from "./levels_get.ts";

const levels_get = new Hono();

levels_get.get(
	describeRoute({
		summary: "Get Knowledges Levels",
		description:
			"Retrieve knowledges levels from the database. Auth is required.",
		tags: ["users-config"],
		responses: {
			200: {
				description: "Success",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								levels: {
									type: "array",
									items: {
										type: "object",
										properties: {
											id: {
												type: "string",
												default: "123",
											},
											level: {
												type: "string",
												default: "beginner",
											},
										},
									},
								},
							},
							required: ["levels"],
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
									default: "No level found",
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
		return await get_levels(c);
	},
);

export default levels_get;
