#!/usr/bin/env node
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getTursoClient } from "./turso-client.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "../..");

dotenv.config({ path: path.join(backendRoot, ".env") });

function splitSqlStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = "";
  let inTrigger = false;

  for (const line of sql.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("--")) {
      continue;
    }

    current += `${line}\n`;

    if (/CREATE TRIGGER/i.test(line)) {
      inTrigger = true;
    }

    if (inTrigger && /END\s*;?\s*$/i.test(trimmed)) {
      inTrigger = false;
      statements.push(current.trim().replace(/;\s*$/, ""));
      current = "";
      continue;
    }

    if (!inTrigger && trimmed.endsWith(";")) {
      statements.push(current.trim().replace(/;\s*$/, ""));
      current = "";
    }
  }

  if (current.trim()) {
    statements.push(current.trim().replace(/;\s*$/, ""));
  }

  return statements.filter(Boolean);
}

async function executeStatement(sql: string) {
  const client = getTursoClient();
  await client.execute(sql);
}

async function runFile(label: string, filePath: string) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Migration file not found: ${filePath}`);
  }

  const sql = fs.readFileSync(filePath, "utf8");
  const statements = splitSqlStatements(sql);

  console.log(`\n==> ${label} (${statements.length} statements)`);

  for (const statement of statements) {
    const preview = statement.split("\n")[0].slice(0, 80);
    try {
      await executeStatement(statement);
      console.log(`  OK: ${preview}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);

      if (message.includes("401")) {
        console.error(`
Turso authentication failed (401).

Create a fresh database token in Turso dashboard:
1. Open https://turso.tech/app
2. Select database: issue-tracker
3. Tokens -> Create Token
4. Update backend/.env -> TURSO_AUTH_TOKEN
5. Run: npm run db:migrate:turso
`);
        process.exit(1);
      }

      if (
        message.includes("already exists") ||
        message.includes("duplicate column")
      ) {
        console.log(`  SKIP (already applied): ${preview}`);
        continue;
      }

      console.error(`  FAIL: ${preview}`);
      throw error;
    }
  }
}

async function migrateTurso() {
  console.log("Running Turso migrations...");

  await runFile(
    "better-auth",
    path.join(
      backendRoot,
      "better-auth_migrations/2025-07-11T02-30-51.059Z.sql",
    ),
  );

  const migrationsDir = path.join(__dirname, "migrations");
  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of migrationFiles) {
    await runFile(file, path.join(migrationsDir, file));
  }

  const client = getTursoClient();
  const tables = await client.execute(
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
  );

  console.log("\nTables in Turso:");
  for (const row of tables.rows) {
    console.log(`  - ${row.name}`);
  }

  console.log("\nTurso migrations completed successfully.");
}

migrateTurso().catch((error) => {
  console.error("\nTurso migration failed:", error);
  process.exit(1);
});
