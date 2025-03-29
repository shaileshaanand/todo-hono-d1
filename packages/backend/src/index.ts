import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { cors } from "hono/cors";
import * as schema from "./db/schema";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";

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
  )
  .get(
    "/todo/:id",
    zValidator("param", z.object({ id: z.string().pipe(z.coerce.number()) })),
    async (c) => {
      const db = drizzle(c.env.DB, { schema });
      const todo = await db.query.todos.findFirst({
        where: and(
          eq(schema.todos.id, c.req.valid("param").id),
          eq(schema.todos.deleted, false),
        ),
        columns: {
          deleted: false,
        },
      });

      console.log(todo);

      if (!todo) return c.notFound();
      return c.json<typeof todo>(todo);
    },
  )
  .delete(
    "/todo/:id",
    zValidator("param", z.object({ id: z.string().pipe(z.coerce.number()) })),
    async (c) => {
      const id = c.req.valid("param").id;
      const db = drizzle(c.env.DB, { schema });
      const [deletedTodo] = await db
        .update(schema.todos)
        .set({ deleted: true })
        .where(and(eq(schema.todos.id, id), eq(schema.todos.deleted, false)))
        .returning();
      if (!deletedTodo) return c.notFound();
      return new Response(null, {
        status: 204,
      });
    },
  );

export default app;
