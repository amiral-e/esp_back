import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";

import admin from "./admins/index.ts";
import categories from "./categories/index.ts";
import conversations from "./conversations/index.ts";
import collections from "./collections/index.ts";
import chat from "./chat/index.ts";

const app = new OpenAPIHono();

app.doc("/doc", {
	openapi: "3.0.0",
	info: {
		version: "1.0.0",
		title: "My API",
	},
});

app.get("/docs", swaggerUI({ url: "/doc" }));

app.get("/", (c) => {
	return c.text("Hello Hono!");
});

app.route('/admins', admin);
// app.route('/categories', categories);
app.route('/conversations', conversations);
// app.route('/collections', collections);
app.route('/chat', chat);

console.log("Server running on port 3000");

export default {
	port: 3000,
	fetch: app.fetch,
};
