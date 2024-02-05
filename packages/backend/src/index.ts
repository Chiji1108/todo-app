import { Hono } from "hono";
import todos from "./todos";

export type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>().basePath("/api/v1");

const route = app.route("/todos", todos);

export type AppType = typeof route;

export default app;
