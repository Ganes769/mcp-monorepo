import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../dist/index.js";

let app: FastifyInstance | null = null;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (!app) {
    app = await buildApp();
    await app.ready();
  }

  app.server.emit("request", req, res);
}
