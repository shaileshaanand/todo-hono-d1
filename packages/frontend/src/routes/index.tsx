import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import type { routes } from "backend/src/index";
import { hc } from "hono/client";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  useEffect(() => {
    const client = hc<typeof routes>("http://localhost:8787/");
    console.log("EFFECT");
    client.todo
      .$get()
      .then((r) => {
        r.ok;
        return r.json();
      })
      .then((res) => console.log(res));
  }, []);
  return <div>Hello</div>;
}
