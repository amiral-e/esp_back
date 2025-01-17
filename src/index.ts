import { swaggerUI } from "@hono/swagger-ui";

import admin from "./admins/index.ts";
import categories from "./categories/index.ts";
import conversations from "./conversations/index.ts";
import collections from "./collections/index.ts";
import documents from "./documents/index.ts";
import chat from "./chat/index.ts";
import global from "./global/index.ts";

import config from "./config.ts";
import AuthMiddleware from "./auth_middleware.ts";

import { Hono } from "hono";

const app = new Hono();

// app.doc("/doc", {
// 	openapi: "3.0.0",
// 	info: {
// 		version: "1.0.0",
// 		title: "My API",
// 	},
// });

// app.get("/docs", swaggerUI({ url: "/doc" }));

app.get("/", (c) => {
	return c.json({
		message: "Hello World",
		supabaseClient: config.supabaseClient != null,
	});
});

// const temp = new OpenAPIHono();

// AuthMiddleware
// const user = c.get('user');

import { decode, sign, verify } from "hono/jwt";

app.get("/test", async (c) => {
	const payload = {
		uid: "83774a5e-285f-4b98-b35a-12b3b753f99e",
	};
	const token = await sign(payload, config.envVars.JWT_SECRET);
	console.log(token);
	// const user = c.get('user');
	return c.json({
		message: "Hello World",
		// user: user,
	});
});

app.route("/admins", admin);
// // app.route('/categories', categories);
app.route("/conversations", conversations);
app.route("/collections", collections);
app.route("/collections", documents);
app.route("/global", global);
app.route("/chat", chat);

console.log("Server running on port 3000");

export default {
	port: 3000,
	fetch: app.fetch,
};
