import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(backendRoot, ".env"), quiet: true });

// Known deployed frontend origins, kept as a fallback in case FRONTEND_URL
// isn't set (or isn't fully set) on the hosting platform. FRONTEND_URL can
// hold a comma-separated list to support multiple origins (e.g. production
// + preview deployments).
const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://mcp-monorepo-theta.vercel.app",
];

export function getAllowedOrigins(): string[] {
  const fromEnv = (process.env.FRONTEND_URL ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return Array.from(new Set([...fromEnv, ...DEFAULT_ALLOWED_ORIGINS]));
}
