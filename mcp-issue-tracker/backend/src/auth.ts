import "./env.js";
import { betterAuth } from "better-auth";
import { apiKey } from "better-auth/plugins";
import { createClient } from "@libsql/client/web";
import path from "path";
import { fileURLToPath } from "url";
import { isTursoEnabled } from "./db/turso-client.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const baseUrl = (process.env.BETTER_AUTH_BASE_URL ?? "http://localhost:3000").replace(
  /\/$/,
  "",
);

const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:5173";

async function createAuthDatabase() {
  if (isTursoEnabled()) {
    // Better Auth needs an explicit type; raw libsql client alone fails adapter init.
    return {
      db: createClient({
        url: process.env.TURSO_DATABASE_URL!.trim(),
        authToken: process.env.TURSO_AUTH_TOKEN!.trim(),
      }),
      type: "sqlite" as const,
    };
  }

  if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
    throw new Error(
      "TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set on Vercel",
    );
  }

  const { default: Database } = await import("better-sqlite3");
  return new Database(path.resolve(__dirname, "..", "database.sqlite"));
}

const database = await createAuthDatabase();

const authConfig = {
  database,
  ...(process.env.BETTER_AUTH_SECRET
    ? { secret: process.env.BETTER_AUTH_SECRET }
    : {}),
  baseURL: `${baseUrl}/api/auth`,
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: [
    frontendUrl,
    baseUrl,
    "http://localhost:5173",
    "http://localhost:5174",
  ],
  plugins: [
    apiKey({
      defaultPrefix: "issues_",
      enableMetadata: true,
    }),
  ],
};

const authInstance = betterAuth(authConfig);

export const auth = {
  handler: authInstance.handler,
  api: authInstance.api,
};

export const authBaseUrl = baseUrl;
