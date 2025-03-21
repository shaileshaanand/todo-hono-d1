import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { cors } from "hono/cors";
import * as schema from "./db/schema";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { swaggerUI } from "@hono/swagger-ui";

export type Env = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Env }>();

export const routes = app.use(cors());
app
  .get("/swagger", swaggerUI({ url: "/todo" }))
  .get("/todo", async (c) => {
    const db = drizzle(c.env.DB, { schema });
    const todos = await db.query.todos.findMany();
    return c.json(todos);
  })
  .post(
    "/todo",
    zValidator(
      "json",
      z.object({
        title: z.string().min(3),
        deadline: z.coerce.date().optional(),
      })
    ),
    async (c) => {
      const db = drizzle(c.env.DB, { schema });
      const todo = await db
        .insert(schema.todos)
        .values(c.req.valid("json"))
        .returning();
      return c.json(todo);
    }
  );

export default app;
