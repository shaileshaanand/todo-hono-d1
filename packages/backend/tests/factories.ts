import { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "../src/db/schema";
import { faker } from "@faker-js/faker";

export const todoFactory = async (
  db: DrizzleD1Database<typeof schema>,
  {
    title,
    deadline,
    done,
    deleted,
  }:
    | { title?: string; deadline?: Date; done?: boolean; deleted?: boolean }
    | undefined = {},
) => {
  const [todo] = await db
    .insert(schema.todos)
    .values({
      title: title ?? faker.lorem.sentence(),
      deadline: deadline ?? faker.date.future(),
      done: done ?? false,
      deleted: deleted ?? false,
    })
    .returning();
  return todo;
};
