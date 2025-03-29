import { env } from "cloudflare:test";
import { routes } from "../src/index";
import { beforeAll, describe, expect, it } from "vitest";
import { testClient } from "hono/testing";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "../src/db/schema";
import { faker } from "@faker-js/faker";
import { todoFactory } from "./factories";

const client = testClient(routes, env);
const db = drizzle(env.DB, { schema });

describe("Todo tests", () => {
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
    const todoPayloads = [
      {
        title: faker.lorem.sentence(),
        deadline: faker.date.future(),
        done: true,
        deleted: true,
      },
      {
        title: faker.lorem.sentence(),
        deadline: faker.date.future(),
        done: false,
        deleted: true,
      },
      {
        title: faker.lorem.sentence(),
        done: true,
        deadline: faker.date.past(),
      },
      {
        title: faker.lorem.sentence(),
        done: false,
      },
      {
        title: faker.lorem.sentence(),
        done: true,
        deadline: faker.date.past(),
      },
      {
        title: faker.lorem.sentence(),
        deadline: faker.date.past(),
        done: false,
      },
    ];

    const allTodos = await db
      .insert(schema.todos)
      .values(todoPayloads)
      .returning();

    const notDeletedTodos = allTodos.filter(
      (todoPayload) => !todoPayload.deleted,
    );

    const resp = await client.todo.$get();
    expect(resp.status).toBe(200);
    const data = await resp.json();

    expect(data.length).toBe(4);
    notDeletedTodos.map((notDeletedTodo) => {
      const correspondingReturnedTodo = data.find(
        (returnedTodo) => returnedTodo.id === notDeletedTodo.id,
      );
      expect(correspondingReturnedTodo).toBeDefined();
      if (!correspondingReturnedTodo) throw new Error("Todo not found");
      expect(correspondingReturnedTodo.title).toBe(notDeletedTodo.title);
      expect(correspondingReturnedTodo.done).toBe(notDeletedTodo.done);
      expect("deleted" in correspondingReturnedTodo).toBe(false);
      if (notDeletedTodo.deadline) {
        expect(correspondingReturnedTodo.deadline).toBe(
          notDeletedTodo.deadline.toISOString(),
        );
      } else {
        expect(correspondingReturnedTodo.deadline).toBeNull();
      }
      expect(correspondingReturnedTodo.createdAt).toBe(
        notDeletedTodo.createdAt.toISOString(),
      );
      expect(correspondingReturnedTodo.updatedAt).toBe(
        notDeletedTodo.updatedAt.toISOString(),
      );
    });
  });

  it("Should get a todo", async () => {
    const todo = await todoFactory(db);

    const resp = await client.todo[":id"].$get({
      param: { id: todo.id.toString() },
    });
    expect(resp.status).toBe(200);
    if (resp.status === 200) {
      const returnedTodo = await resp.json();

      expect(returnedTodo.id).toBe(todo.id);
      expect(returnedTodo.title).toBe(todo.title);
      expect(returnedTodo.deadline).toBe(todo.deadline?.toISOString());
      expect(returnedTodo.done).toBe(todo.done);
      expect(returnedTodo.createdAt).toBeDefined();
      expect("deleted" in returnedTodo).toBe(false);
    }
  });

  it("Should not get a deleted todo", async () => {
    const todo = await todoFactory(db, { deleted: true });

    const resp = await client.todo[":id"].$get({
      param: { id: todo.id.toString() },
    });
    expect(resp.status).toBe(404);
    await expect(resp.json()).rejects.toThrowError();
  });

  it("Should not get a non existent todo", async () => {
    const todo = await todoFactory(db, { deleted: true });

    const resp = await client.todo[":id"].$get({
      param: { id: (todo.id + 1).toString() },
    });
    expect(resp.status).toBe(404);
    await expect(resp.json()).rejects.toThrowError();
  });

  it("Should not get a non existent todo", async () => {
    await todoFactory(db, { deleted: true });

    const resp = await client.todo[":id"].$get({
      param: { id: "abcd" },
    });
    expect(resp.status).toBe(400);
  });

  it("Should delete a todo", async () => {
    const todo = await todoFactory(db);
    const resp = await client.todo[":id"].$delete({
      param: { id: todo.id.toString() },
    });
    expect(resp.status).toBe(204);
    await expect(resp.json()).rejects.toThrowError();
  });
  it("Should not delete a deleted todo", async () => {
    const todo = await todoFactory(db, { deleted: true });

    const resp = await client.todo[":id"].$delete({
      param: { id: todo.id.toString() },
    });
    expect(resp.status).toBe(404);
    await expect(resp.json()).rejects.toThrowError();
  });

  it("Should not delete a non existent todo", async () => {
    const todo = await todoFactory(db, { deleted: true });

    const resp = await client.todo[":id"].$delete({
      param: { id: (todo.id + 1).toString() },
    });

    expect(resp.status).toBe(404);
    await expect(resp.json()).rejects.toThrowError();
  });

  it("Should not delete an invalid todo", async () => {
    const todo = await todoFactory(db, { deleted: true });
    const resp = await client.todo[":id"].$delete({
      param: { id: "abcd" },
    });
    expect(resp.status).toBe(400);
  });
});
