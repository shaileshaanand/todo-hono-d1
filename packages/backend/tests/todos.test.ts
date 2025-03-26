import { env } from "cloudflare:test";
import { routes } from "../src/index";
import { beforeAll, describe, expect, it } from "vitest";
import { testClient } from "hono/testing";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "../src/db/schema";

const client = testClient(routes, env);
const db = drizzle(env.DB, { schema });

describe("Example", () => {
  it("Should create a todo", async () => {
    const payload = {
      title: "Test 1",
    };
    const resp = await client.todo.$post({
      json: payload,
    });
    const responseTodo = await resp.json();

    const createdTodos = await db.query.todos.findMany();
    expect(createdTodos.length).toBe(1);
    const [createdTodo] = createdTodos;
    expect(createdTodo.title).toBe(payload.title);

    expect(resp.status).toBe(200);
  });

  it("Should list todos", async () => {
    const insertedTodo = await db
      .insert(schema.todos)
      .values({
        title: "Test 3",
      })
      .returning();

    const resp = await client.todo.$get();
    expect(resp.status).toBe(200);
    const data = await resp.json();
    expect(data.length).toBe(1);
  });
});
