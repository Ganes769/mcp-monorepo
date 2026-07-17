import { promisify } from "util";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { Client, ResultSet } from "@libsql/client";
import { getTursoClient, isTursoEnabled } from "./turso-client.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

type SqliteDatabase = import("sqlite3").Database;

const DB_PATH = path.resolve(__dirname, "..", "..", "database.sqlite");

export interface Database {
  run: (
    sql: string,
    params?: any[],
  ) => Promise<{ lastID?: number; changes?: number }>;
  get: (sql: string, params?: any[]) => Promise<any>;
  all: (sql: string, params?: any[]) => Promise<any[]>;
  close: () => Promise<void>;
}

class TursoDatabaseConnection implements Database {
  constructor(private client: Client) {}

  async run(sql: string, params: any[] = []) {
    const result = await this.client.execute({ sql, args: params });
    return {
      lastID: Number(result.lastInsertRowid ?? 0),
      changes: result.rowsAffected,
    };
  }

  async get(sql: string, params: any[] = []) {
    const result = await this.client.execute({ sql, args: params });
    return rowToObject(result);
  }

  async all(sql: string, params: any[] = []) {
    const result = await this.client.execute({ sql, args: params });
    return rowsToObjects(result);
  }

  async close() {
    this.client.close();
  }
}

function rowToObject(result: ResultSet) {
  if (!result.rows.length || !result.columns.length) {
    return undefined;
  }

  const row = result.rows[0]!;
  const obj: Record<string, unknown> = {};
  result.columns.forEach((column, index) => {
    obj[column] = row[index];
  });
  return obj;
}

function rowsToObjects(result: ResultSet) {
  return result.rows.map((row) => {
    const obj: Record<string, unknown> = {};
    result.columns.forEach((column, index) => {
      obj[column] = row[index];
    });
    return obj;
  });
}

export class DatabaseConnection {
  private db: SqliteDatabase;
  public run: Database["run"];
  public get: Database["get"];
  public all: Database["all"];
  public close: Database["close"];

  constructor(db: SqliteDatabase) {
    this.db = db;

    this.run = (sql: string, params?: any[]) => {
      return new Promise((resolve, reject) => {
        this.db.run(sql, params || [], function (err) {
          if (err) {
            reject(err);
          } else {
            resolve({
              lastID: this.lastID,
              changes: this.changes,
            });
          }
        });
      });
    };

    this.get = promisify(db.get.bind(db));
    this.all = promisify(db.all.bind(db));
    this.close = promisify(db.close.bind(db));
  }
}

async function loadSqlite3() {
  const sqlite3 = (await import("sqlite3")).default;
  sqlite3.verbose();
  return sqlite3;
}

export async function createDatabase(): Promise<Database> {
  if (isTursoEnabled()) {
    return new TursoDatabaseConnection(getTursoClient());
  }

  const sqlite3 = await loadSqlite3();

  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error("Error opening database:", err);
        reject(err);
      } else {
        if (process.env.NODE_ENV !== "test") {
          console.log("Connected to SQLite database at:", DB_PATH);
        }
        resolve(new DatabaseConnection(db));
      }
    });
  });
}

export async function runMigrations(): Promise<void> {
  if (isTursoEnabled()) {
    throw new Error("Use npm run db:migrate:turso for Turso migrations");
  }

  const db = await createDatabase();

  try {
    await db.run("PRAGMA foreign_keys = ON");

    const migrationsDir = path.join(__dirname, "migrations");
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith(".sql"))
      .sort();

    if (process.env.NODE_ENV !== "test") {
      console.log("Running database migrations...");
    }

    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, "utf8");

      if (process.env.NODE_ENV !== "test") {
        console.log(`Running migration: ${file}`);
      }
      await db.run(sql);
    }

    if (process.env.NODE_ENV !== "test") {
      console.log("All migrations completed successfully!");
    }
  } catch (error) {
    console.error("Error running migrations:", error);
    throw error;
  } finally {
    await db.close();
  }
}

export async function getDatabase(): Promise<Database> {
  if (process.env.NODE_ENV === "test") {
    const { testDb } = await import("../tests/setup.js");
    await testDb.run("PRAGMA foreign_keys = ON");
    return testDb;
  }

  const db = await createDatabase();

  if (!isTursoEnabled()) {
    await db.run("PRAGMA foreign_keys = ON");
  }

  return db;
}
