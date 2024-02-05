import { Hono } from "hono";
import todos from "./todos";

export type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>().basePath("/api/v1");

export const route = app.route("/todos", todos);

export default app;
