import { env } from "cloudflare:test";
import { routes } from "../src/index";
import { beforeAll, describe, expect, it } from "vitest";
import { testClient } from "hono/testing";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "../src/db/schema";
import { faker } from "@faker-js/faker";

const client = testClient(routes, env);
const db = drizzle(env.DB, { schema });

describe("Example", () => {
  it.each([
    {
      title: faker.lorem.sentence(),
    },
    {
      title: faker.lorem.sentence(),
      deadline: faker.date.future().getTime(),
    },
  ])("Should create a todo", async (payload) => {
    const resp = await client.todo.$post({
      json: payload,
    });
    expect(resp.status).toBe(201);
    const responseTodo = await resp.json();

    const createdTodos = await db.query.todos.findMany();
    expect(createdTodos.length).toBe(1);
    const [createdTodo] = createdTodos;
    expect(createdTodo.title).toBe(payload.title);
    expect(createdTodo.done).toBe(false);

    expect(responseTodo.title).toBe(payload.title);
    expect(responseTodo.id).toBeDefined();
    expect(responseTodo.done).toBe(false);
    expect(responseTodo.createdAt).toBeDefined();
    expect(responseTodo.updatedAt).toBeDefined();

    expect("deleted" in responseTodo).toBe(false);
    if (payload.deadline) {
      expect(createdTodo.deadline).toStrictEqual(new Date(payload.deadline));
      expect(responseTodo.deadline).toStrictEqual(
        new Date(payload.deadline).toISOString(),
      );
    } else {
      expect(createdTodo.deadline).toBeNull();
      expect(responseTodo.deadline).toBeNull();
    }
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
