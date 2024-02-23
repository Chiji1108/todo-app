import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import todos from "./todos";

export type Bindings = {
	DB: D1Database;
};

const app = new OpenAPIHono<{ Bindings: Bindings }>()
	.route("/todos", todos)
	.doc("openapi.json", {
		openapi: "3.1.0",
		info: {
			version: "1.0.0",
			title: "My API",
		},
	})
	.get("/", swaggerUI({ url: "openapi.json" }));

export default app;
