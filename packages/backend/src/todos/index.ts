import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { Bindings } from "../";
import * as schema from "./schema";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

const app = new Hono<{ Bindings: Bindings }>();

const insertTodoSchema = createInsertSchema(schema.todos);
const selectTodoSchema = createSelectSchema(schema.todos);

// Get all todos
app.get("/", async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const todos = await db.query.todos.findMany();
  return c.json({ todos });
});

// Create a new todo
app.post("/", zValidator("json", insertTodoSchema), async (c) => {
  const { title } = c.req.valid("json");
  const db = drizzle(c.env.DB, { schema });
  const result = await db.insert(schema.todos).values({ title }).returning();
  return c.json(result);
});

// Update a todo
app.put(
  "/:id",
  zValidator(
    "json",
    selectTodoSchema.pick({ title: true, done: true }).partial()
  ),
  async (c) => {
    const id = c.req.param("id");
    const { title, done } = c.req.valid("json");
    const db = drizzle(c.env.DB, { schema });
    const result = await db
      .update(schema.todos)
      .set({ title, done })
      .where(eq(schema.todos.id, parseInt(id)))
      .returning();
    return c.json(result);
  }
);

// Delete a todo
app.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const db = drizzle(c.env.DB, { schema });
  await db.delete(schema.todos).where(eq(schema.todos.id, parseInt(id)));
  return c.json({ success: true });
});

export default app;
