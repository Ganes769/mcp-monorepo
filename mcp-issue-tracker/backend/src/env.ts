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
  "https://mcp-monorepo.vercel.app",
  "https://mcp-monorepo-theta.vercel.app",
];

// Vercel gives every branch/preview deployment of this monorepo its own
// unique subdomain (e.g. mcp-monorepo-git-main-<team>.vercel.app,
// mcp-monorepo-<hash>-<team>.vercel.app). Rather than hardcoding every one,
// match anything that follows that naming convention.
const VERCEL_PREVIEW_ORIGIN_REGEX = /^https:\/\/mcp-monorepo-[a-z0-9.-]+\.vercel\.app$/i;

// Same idea, expressed as a better-auth wildcard pattern (glob-style "*",
// not a regex) for use in `trustedOrigins`.
const VERCEL_PREVIEW_ORIGIN_WILDCARD = "https://mcp-monorepo-*.vercel.app";

export function getAllowedOrigins(): (string | RegExp)[] {
  const fromEnv = (process.env.FRONTEND_URL ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return Array.from(
    new Set<string | RegExp>([
      ...fromEnv,
      ...DEFAULT_ALLOWED_ORIGINS,
      VERCEL_PREVIEW_ORIGIN_REGEX,
    ])
  );
}

export function getTrustedOriginPatterns(): string[] {
  const fromEnv = (process.env.FRONTEND_URL ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return Array.from(
    new Set([
      ...fromEnv,
      ...DEFAULT_ALLOWED_ORIGINS,
      VERCEL_PREVIEW_ORIGIN_WILDCARD,
    ])
  );
}
