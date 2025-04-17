import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../../config.ts";
import AuthMiddleware from "../../middlewares/auth.ts";

const price_put = new Hono();

price_put.put(
	"/:price_name",
	describeRoute({
		summary: "Update a Platform Price",
		description:
			"Update a platform price in the database. Admin privileges are required.",
		tags: ["admins-platform"],
		requestBody: {
			required: true,
			content: {
				"application/json": {
					schema: {
						type: "object",
						properties: {
							value: {
								type: "float",
								description: "The new value for the price.",
								default: 0.5,
							},
						},
						required: ["value"],
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
								message: {
									type: "string",
									default: "Price updated successfully",
								},
							},
							required: ["message"],
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
		return await put_price(c);
	},
);


async function put_price(c: any) {
	const user = c.get("user");
	if (!user.admin) return c.json({ error: "Forbidden" }, 403);

	const { price_name } = c.req.param();

	let value = "";
	try {
		const json = await c.req.json();
		if (json?.value == undefined || typeof json?.value !== "number")
			throw new Error();
		value = json.value;
	} catch (error) {
		return c.json({ error: "Invalid JSON" }, 400);
	}

	const price = await config.supabaseClient
		.from("prices")
		.select("*")
		.eq("price", price_name)
		.single();

	if (price.data == undefined)
		return c.json({ error: "No price found" }, 404);

	await config.supabaseClient
		.from("prices")
		.update({ value: value })
		.eq("price", price_name);

	return c.json({ message: "Price updated successfully" }, 200);
}

export default price_put;
