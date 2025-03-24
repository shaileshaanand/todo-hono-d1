import { env } from "cloudflare:test";
import { migrate } from "drizzle-orm/d1/migrator";
import app, { type Env } from "../src/index";
import { beforeAll, describe, expect, it } from "vitest";
import { drizzle } from "drizzle-orm/d1";

declare module "cloudflare:test" {
  interface ProvidedEnv extends Env {}
}

describe("Todos", () => {
  beforeAll(async () => {
    await migrate(drizzle(env.DB), {
      migrationsFolder: "drizzle",
    });
  });

  it("should create a new todo", async () => {
    const resp = await app.request(
      "http://localhost/todo",
      {
        method: "GET",
      },
      env
    );
    expect(resp.status).toBe(200);
  });
});
