import { Hono } from "hono";
import { cors } from "hono/cors";

const app = new Hono();

export const routes = app.use(cors()).get("/", (c) =>
  c.json({
    a: "b",
  }),
);

export default app;
