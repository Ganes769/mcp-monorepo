import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../dist/index.js";

let app: FastifyInstance | null = null;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  try {
    if (!app) {
      app = await buildApp();
      await app.ready();
    }

    app.server.emit("request", req, res);
  } catch (error) {
    console.error("Vercel handler error:", error);
    res.statusCode = 500;
    res.setHeader("content-type", "application/json");
    res.end(
      JSON.stringify({
        error: "Server startup failed",
        message: error instanceof Error ? error.message : "Unknown error",
      })
    );
  }
}
