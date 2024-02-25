import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { and, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { getCookie } from 'hono/cookie';
import { Bindings } from '..';
import { authorize } from '../auth';
import { todos } from '../schema';
import * as schema from '../schema';

const selectTodoSchema = createSelectSchema(todos, {
	id: (schema) => schema.id.openapi({ example: 12 }),
	title: (schema) => schema.title.openapi({ example: 'shopping' }),
	completed: (schema) => schema.completed.openapi({ example: false }),
}).openapi('Todo');

const app = new OpenAPIHono<{ Bindings: Bindings; Variables: { userId: string } }>()
	.openapi(
		createRoute({
			method: 'get',
			path: '/{id}',
			request: {
				params: z.object({
					id: z.string(),
				}),
			},
			responses: {
				200: {
					content: {
						'application/json': {
							schema: selectTodoSchema.nullable(),
						},
					},
					description: 'Returns a todo by id',
				},
			},
			tags: ['todos'],
		}),
		async (c) => {
			const { id } = c.req.valid('param');
			const db = drizzle(c.env.DB, { schema });
			const result = await db.query.todos.findFirst({
				where: and(eq(todos.id, parseInt(id)), eq(todos.userId, c.var.userId)),
			});
			if (!result) {
				return c.json(null, { status: 404 });
			}
			return c.json(result);
		}
	)
	.openapi(
		createRoute({
			method: 'get',
			path: '/',
			responses: {
				200: {
					content: {
						'application/json': {
							schema: z.array(selectTodoSchema),
						},
					},
					description: 'Returns all todos',
				},
			},
			tags: ['todos'],
		}),
		async (c) => {
			const db = drizzle(c.env.DB, { schema });
			const result = await db.query.todos.findMany({ where: eq(todos.userId, c.var.userId) });
			return c.json(result);
		}
	)
	.openapi(
		createRoute({
			method: 'post',
			path: '/',
			request: {
				body: {
					content: {
						'application/json': {
							schema: selectTodoSchema.pick({ title: true }),
						},
					},
				},
			},
			responses: {
				200: {
					content: {
						'application/json': {
							schema: selectTodoSchema,
						},
					},
					description: 'Creates a new todo',
				},
			},
			tags: ['todos'],
		}),
		async (c) => {
			console.log('post');
			console.log('c.var.userId', c.var.userId);
			const { title } = c.req.valid('json');
			const db = drizzle(c.env.DB, { schema });
			const [newTodo] = await db.insert(todos).values({ title, userId: c.var.userId }).returning();
			return c.json(newTodo);
		}
	)
	.openapi(
		createRoute({
			method: 'patch',
			path: '/{id}',
			request: {
				params: z.object({
					id: z.string(),
				}),
				body: {
					content: {
						'application/json': {
							schema: selectTodoSchema.pick({ completed: true, title: true }).partial(),
						},
					},
				},
			},
			responses: {
				200: {
					content: {
						'application/json': {
							schema: selectTodoSchema,
						},
					},
					description: 'Updates a todo',
				},
			},
			tags: ['todos'],
		}),
		async (c) => {
			const { id } = c.req.valid('param');
			const { title, completed } = c.req.valid('json');
			const db = drizzle(c.env.DB, { schema });
			const [updatedTodo] = await db
				.update(todos)
				.set({ title, completed })
				.where(and(eq(todos.id, parseInt(id)), eq(todos.userId, c.var.userId)))
				.returning();
			return c.json(updatedTodo);
		}
	)
	.openapi(
		createRoute({
			method: 'delete',
			path: '/{id}',
			request: {
				params: z.object({
					id: z.string(),
				}),
			},
			responses: {
				200: {
					content: {
						'application/json': {
							schema: z.object({
								ok: z.boolean(),
							}),
						},
					},
					description: 'Deletes a todo',
				},
			},
			tags: ['todos'],
		}),
		async (c) => {
			const { id } = c.req.valid('param');
			const db = drizzle(c.env.DB, { schema });
			await db.delete(todos).where(and(eq(todos.id, parseInt(id)), eq(todos.userId, c.var.userId)));
			return c.json({ ok: true });
		}
	);

export default app;
