import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";

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

console.log("Server running on port 3000");

export default {
	port: 3000,
	fetch: app.fetch,
};
