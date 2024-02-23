import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { drizzle } from "drizzle-orm/d1";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import * as schema from "./schema";

export type Bindings = {
	DB: D1Database;
};
// export interface Env {
// 	DB: D1Database;
// 	// Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
// 	// MY_KV_NAMESPACE: KVNamespace;
// 	//
// 	// Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
// 	// MY_DURABLE_OBJECT: DurableObjectNamespace;
// 	//
// 	// Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
// 	// MY_BUCKET: R2Bucket;
// 	//
// 	// Example binding to a Service. Learn more at https://developers.cloudflare.com/workers/runtime-apis/service-bindings/
// 	// MY_SERVICE: Fetcher;
// 	//
// 	// Example binding to a Queue. Learn more at https://developers.cloudflare.com/queues/javascript-apis/
// 	// MY_QUEUE: Queue;
// }

import { swaggerUI } from "@hono/swagger-ui";
import { eq } from "drizzle-orm";
import { todos } from "./schema";
// import todos from "./todos";

const app = new OpenAPIHono<{ Bindings: Bindings }>();

const selectTodoSchema = createSelectSchema(todos, {
	id: (schema) => schema.id.openapi({ example: 12 }),
	title: (schema) => schema.title.openapi({ example: "shopping" }),
	completed: (schema) => schema.completed.openapi({ example: false }),
});

app.openapi(
	createRoute({
		method: "get",
		path: "/todos/{id}",
		request: {
			params: z.object({
				id: z.string(),
			}),
		},
		responses: {
			200: {
				constent: {
					"application/json": {
						schema: selectTodoSchema.nullable().openapi("Todo"),
					},
				},
				description: "Returns a todo by id",
			},
		},
	}),
	async (c) => {
		const { id } = c.req.valid("param");
		const db = drizzle(c.env.DB, { schema });
		const result = await db.query.todos.findFirst({
			where: eq(todos.id, parseInt(id)),
		});
		if (!result) {
			return c.json(null, { status: 404 });
		}
		return c.json({
			id: result.id,
			title: result.title,
			completed: result.completed,
		});
	},
);

app.doc("openapi.json", {
	openapi: "3.1.0",
	info: {
		version: "1.0.0",
		title: "My API",
	},
});

app.get("/", swaggerUI({ url: "openapi.json" }));

export default app;
