import "./env.js";
import { betterAuth } from "better-auth";
import { apiKey } from "better-auth/plugins";
import { LibsqlDialect } from "@libsql/kysely-libsql";
import path from "path";
import { fileURLToPath } from "url";
import { isTursoEnabled } from "./db/turso-client.js";
import { getTrustedOriginPatterns } from "./env.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const baseUrl = process.env.BETTER_AUTH_BASE_URL ?? "http://localhost:3000";

// Better Auth cannot consume a raw @libsql/client instance; it needs a
// Kysely dialect (or a better-sqlite3 Database) as its `database` option.
async function createAuthDatabase() {
  if (isTursoEnabled()) {
    return {
      dialect: new LibsqlDialect({
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

if (
  !process.env.BETTER_AUTH_SECRET &&
  (process.env.VERCEL || process.env.NODE_ENV === "production")
) {
  console.error("BETTER_AUTH_SECRET is not set — auth will fail in production");
}

const authConfig = {
  database,
  ...(process.env.BETTER_AUTH_SECRET
    ? { secret: process.env.BETTER_AUTH_SECRET }
    : {}),
  baseURL: `${baseUrl.replace(/\/$/, "")}/api/auth`,
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: [...getTrustedOriginPatterns(), baseUrl],
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

export const authBaseUrl = baseUrl.replace(/\/$/, "");
