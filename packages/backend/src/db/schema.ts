import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const todos = sqliteTable("todos", {
  id: integer().primaryKey({ autoIncrement: true }),
  done: integer({ mode: "boolean" }).default(false).notNull(),
  title: text().notNull(),
  deadline: integer({ mode: "timestamp_ms" }),
  deleted: integer({ mode: "boolean" }).default(false).notNull(),
  updatedAt: integer({ mode: "timestamp_ms" })
    .$onUpdate(() => new Date())
    .notNull(),
  createdAt: integer({ mode: "timestamp_ms" })
    .$default(() => new Date())
    .notNull(),
});
