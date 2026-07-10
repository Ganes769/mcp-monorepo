import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import path from "path";
import sqlite3 from "sqlite3";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = new McpServer({
  name: "issue-server",
  version: "1.0.0",
});
server.registerResource(
  "Database schema",
  "schema://database",
  {
    title: "Database schema",
    description: "Database schema for the issue tracker",
    mimeType: "text/plain",
  },
  async (uri) => {
    const dbPath = path.join(__dirname, "..", "backend", "database.sqlite");
    const schema = await new Promise((resolve, reject) => {
      const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY);
      db.all(
        "SELECT sql FROM sqlite_master WHERE type='table' AND sql IS NOT NULL ORDER BY name",
        (error, rows) => {
          db.close();
          if (error) {
            reject(error);
          } else {
            resolve(rows.map((row) => row.sql + ";").join("\n"));
          }
        },
      );
    });

    return {
      contents: [{ uri: uri.href, mimeType: "text/plain", text: schema }],
    };
  },
);
const transport = new StdioServerTransport();
await server.connect(transport);
