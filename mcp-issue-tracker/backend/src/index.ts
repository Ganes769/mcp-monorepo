import "./env.js";
import { buildApp } from "./app.js";

export { buildApp } from "./app.js";

// Local dev only — Vercel uses api/index.ts
if (process.env.NODE_ENV !== "test" && !process.env.VERCEL) {
  const app = await buildApp();
  const port = Number(process.env.PORT) || 3000;
  await app.listen({ port, host: "0.0.0.0" });
}
