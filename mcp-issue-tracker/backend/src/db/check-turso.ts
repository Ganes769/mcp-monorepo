#!/usr/bin/env node
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { getTursoClient, normalizeTursoUrl } from "./turso-client.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "../..");

dotenv.config({ path: path.join(backendRoot, ".env"), quiet: true });

async function checkTurso() {
  const url = process.env.TURSO_DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN?.trim();

  if (!url || !token) {
    console.error("Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN in backend/.env");
    process.exit(1);
  }

  console.log("Database URL:", normalizeTursoUrl(url));
  console.log("Token length:", token.length);

  try {
    const client = getTursoClient();
    const result = await client.execute("SELECT 1 AS ok");
    console.log("Turso connection OK:", result.rows);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Turso connection failed:", message);
    console.error(`
This is usually the wrong token type.

In Turso dashboard:
1. Open https://turso.tech/app
2. Click database "issue-tracker" (not organization settings)
3. Open the database "Connect" / "Connect" tab
4. Copy the LibSQL URL into TURSO_DATABASE_URL
5. Click "Create Database Token" on THAT database page
6. Paste the new token into TURSO_AUTH_TOKEN
7. Run: npm run db:turso:check
`);
    process.exit(1);
  }
}

checkTurso();
