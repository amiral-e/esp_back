import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import AuthMiddleware from "../../middlewares/auth.ts";
import get_prices from "./prices_get.ts";

const prices_get = new Hono();

prices_get.get(
	describeRoute({
		summary: "Get Platform Prices",
		description:
			"Retrieve platform prices from the database. Admin privileges are required.",
		tags: ["admins-platform"],
		responses: {
			200: {
				description: "Success",
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								prices: {
									type: "array",
									items: {
										type: "object",
										properties: {
											price: {
												type: "string",
												default: "price_groq_output",
											},
											description: {
												type: "string",
												default: "original price of x / 1M tokens",
											},
											value: {
												type: "float",
												default: "beginner",
											},
										},
									},
								},
							},
							required: ["prices"],
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
									default: "No price found",
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
		return await get_prices(c);
	},
);

export default prices_get;
