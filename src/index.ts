import { Hono } from "hono";
import { openAPISpecs } from "hono-openapi";

import admin from "./admins/index.ts";
import categories from "./users/categories/index.ts";
import conversations from "./users/conversations/index.ts";
import collections from "./users/collections/index.ts";
import documents from "./users/documents/index.ts";
import chat from "./users/chat/index.ts";
import test from "./test/index.ts";
import config from "./config.ts";

const app = new Hono();

app.get("/", (c) => {
	return c.json({
		message: "Hello World",
	});
});

app.route("/admins", admin);
app.route("/categories", categories);
app.route("/conversations", conversations);
app.route("/collections", collections);
app.route("/collections", documents);
app.route("/forum", forum);
app.route("/chat", chat);
app.route("/test", test);

app.get(
	"/openapi",
	openAPISpecs(app, {
		documentation: {
			info: {
				title: "Hono API",
				version: "1.0.0",
				description: "Hono API Documentation",
			},
			servers: [{ url: "http://localhost:3000", description: "Local Server" }],
			components: {
				securitySchemes: {
					bearerAuth: {
						type: "http",
						scheme: "bearer",
						bearerFormat: "JWT",
					},
				},
				schemas: {
					Error: {
						type: "object",
						properties: {
							error: {
								type: "string",
							},
						},
					},
				},
			},
			security: [
				{
					bearerAuth: [],
				},
			],
		},
	}),
);

import { apiReference } from "@scalar/hono-api-reference";

app.get(
	"/docs",
	apiReference({
		theme: "saturn",
		spec: { url: "/openapi" },
	}),
);

console.log("Server running on port 3000");

export default {
	port: 3000,
	fetch: app.fetch,
};
