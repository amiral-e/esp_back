import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";

import routes_admin from "./admins/index.ts";
import routes_category from "./categories/index.ts";
const app = new OpenAPIHono();

app.doc("/doc", {
	openapi: "3.0.0",
	info: {
		version: "1.0.0",
		title: "My API",
	},
});

app.get("/ui", swaggerUI({ url: "/doc" }));

app.get("/", (c) => {
	return c.text("Hello Hono!");
});

app.route('/admins', routes_admin);
app.route('/categories', routes_category);

console.log("Server running on port 3000");

export default {
	port: 3000,
	fetch: app.fetch,
};
