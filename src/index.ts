import { Hono } from "hono";
import { openAPISpecs } from "hono-openapi";

import admin from "./admins/index.ts";
import test from "./test/index.ts";

import chat_post from "./users/chat/chat_post.ts";
import chat_collection_post from "./users/chat/chat_collection_post.ts";

import collections_get from "./users/collections/collections_get.ts";
import collection_delete from "./users/collections/collection_delete.ts";

import conversations_get from "./users/conversations/conversations_get.ts";
import conversation_get from "./users/conversations/conversation_get.ts";
import conversation_post from "./users/conversations/conversation_post.ts";
import conversation_delete from "./users/conversations/conversation_delete.ts";
import conversation_put from "./users/conversations/conversation_put.ts";

import document_delete from "./users/documents/document_delete.ts";
import documents_get from "./users/documents/documents_get.ts";
import documents_post from "./users/documents/documents_post.ts";

import forum from "./users/forum/index.ts";

import profile_get from "./users/profile/profile_get.ts";
import level_put from "./users/profile/level_put.ts";
import usage_get from "./users/profile/usage_get.ts";

import levels_get from "./users/config/levels_get.ts";

import questions_get from "./users/questions/questions_get.ts";

const app = new Hono();

app.get("/", (c) => {
	return c.json({
		message: "Hello World",
	});
});

app.route("/admins", admin);

if (process.env.NODE_ENV !== "production") {
	app.route("/test", test);
}

app.route("/conversations", chat_post);
app.route("/conversations", chat_collection_post);

app.route("/collections", collections_get);
app.route("/collections", collection_delete);

app.route("/conversations", conversations_get);
app.route("/conversations", conversation_get);
app.route("/conversations", conversation_post);
app.route("/conversations", conversation_put);
app.route("/conversations", conversation_delete);

app.route("/collections", documents_get);
app.route("/collections", document_delete);
app.route("/collections", documents_post);

app.route("/forum", forum);

app.route("/profile", profile_get);
app.route("/profile/level", level_put);
app.route("/profile/usage", usage_get);

app.route("/config/levels", levels_get);

app.route("/questions", questions_get);

app.get(
	"/openapi",
	openAPISpecs(app, {
		documentation: {
			info: {
				title: "Hono API",
				version: "1.0.0",
				description: "Hono API Documentation",
			},
			servers: [{ description: "Server" }],
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
