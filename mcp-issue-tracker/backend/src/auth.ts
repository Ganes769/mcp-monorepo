import { betterAuth } from "better-auth";
import { apiKey } from "better-auth/plugins";
import { createClient } from "@libsql/client/web";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import { isTursoEnabled } from "./db/turso-client.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const baseUrl =
  process.env.BETTER_AUTH_BASE_URL ?? "http://localhost:3000";

const frontendUrl =
  process.env.FRONTEND_URL ?? "http://localhost:5173";

const database = isTursoEnabled()
  ? createClient({
      url: process.env.TURSO_DATABASE_URL!.trim(),
      authToken: process.env.TURSO_AUTH_TOKEN!.trim(),
    })
  : new Database(path.resolve(__dirname, "..", "database.sqlite"));

const authConfig = {
  database,
  baseURL: `${baseUrl}/api/auth`,
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: [frontendUrl, baseUrl, "http://localhost:5173", "http://localhost:5174"],
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
