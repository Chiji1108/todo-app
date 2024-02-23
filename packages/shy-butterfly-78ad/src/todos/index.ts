import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { createSelectSchema } from "drizzle-zod";
import { Bindings } from "..";
import { todos } from "../schema";
import * as schema from "../schema";

const selectTodoSchema = createSelectSchema(todos, {
	id: (schema) => schema.id.openapi({ example: 12 }),
	title: (schema) => schema.title.openapi({ example: "shopping" }),
	completed: (schema) => schema.completed.openapi({ example: false }),
}).openapi("Todo");

const app = new OpenAPIHono<{ Bindings: Bindings }>()
	.openapi(
		createRoute({
			method: "get",
			path: "/{id}",
			request: {
				params: z.object({
					id: z.string(),
				}),
			},
			responses: {
				200: {
					content: {
						"application/json": {
							schema: selectTodoSchema.nullable(),
						},
					},
					description: "Returns a todo by id",
				},
			},
			tags: ["todos"],
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
			return c.json(result);
		},
	)
	.openapi(
		createRoute({
			method: "get",
			path: "/",
			responses: {
				200: {
					content: {
						"application/json": {
							schema: z.array(selectTodoSchema),
						},
					},
					description: "Returns all todos",
				},
			},
			tags: ["todos"],
		}),
		async (c) => {
			const db = drizzle(c.env.DB, { schema });
			const result = await db.query.todos.findMany();
			return c.json(result);
		},
	);

export default app;
