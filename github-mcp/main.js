import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import registerGithubTools from "./github-tools.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env"), quiet: true });

const server = new McpServer({
  name: "github-mcp-server",
  version: "1.0.0",
});

registerGithubTools(server);

const transport = new StdioServerTransport();
await server.connect(transport);
