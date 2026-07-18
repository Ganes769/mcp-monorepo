import "./env.js";
import { buildApp } from "./app.js";

export { buildApp } from "./app.js";

// Vercel Fastify: call listen() — the platform intercepts it and routes requests.
// Skip during tests so vitest can call buildApp() itself.
if (process.env.NODE_ENV !== "test") {
  const app = await buildApp();
  const port = Number(process.env.PORT) || 3000;
  await app.listen({ port, host: "0.0.0.0" });
}
