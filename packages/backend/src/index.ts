import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { cors } from "hono/cors";
import * as schema from "./db/schema";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";

export interface Env {
  DB: D1Database;
}

const app = new Hono<{ Bindings: Env }>();

const todoInsertValidator = z.object({
  title: z.string().min(3),
  // deadline: z.coerce.date().optional(),
  deadline: z.number().pipe(z.coerce.date()).optional(),
});

export const routes = app
  .use(cors())
  .get("/todo", async (c) => {
    const db = drizzle(c.env.DB, { schema });

    const todos = await db.query.todos.findMany({
      orderBy: [desc(schema.todos.createdAt)],
      where: eq(schema.todos.deleted, false),
      columns: {
        deleted: false,
      },
    });
    return c.json(todos);
  })
  .post("/todo", zValidator("json", todoInsertValidator), async (c) => {
    const db = drizzle(c.env.DB, { schema });
    const [{ deleted: _, ...todo }] = await db
      .insert(schema.todos)
      .values(c.req.valid("json"))
      .returning();
    return c.json(todo, 201);
  })
  .put(
    "/todo/:id",
    zValidator("param", z.coerce.number()),
    zValidator("json", todoInsertValidator),
    (c) => {
      const db = drizzle(c.env.DB, { schema });
      db.update(schema.todos)
        .set(c.req.valid("json"))
        .where(eq(schema.todos.id, c.req.valid("param")));
      return c.json({});
    },
  );

export default app;
