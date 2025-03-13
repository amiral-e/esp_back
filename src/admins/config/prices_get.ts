import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../../config.ts";
import AuthMiddleware from "../../middlewares/auth.ts";

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
		const user = c.get("user");
		if (!user.admin) return c.json({ error: "Forbidden" }, 403);

		const prices = await config.supabaseClient
			.from("prices")
			.select("price, description, value");
		if (prices.data == undefined || prices.data.length == 0)
			return c.json({ error: "No price found" }, 404);
		else if (prices.error != undefined)
			return c.json({ error: prices.error.message }, 500);

		return c.json({ prices: prices.data }, 200);
	},
);

export default prices_get;
