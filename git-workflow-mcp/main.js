import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { getRepoPath } from "./config.js";
import registerWorkflowTools from "./workflow-tools.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env"), quiet: true });

const server = new McpServer({
  name: "git-workflow-mcp-server",
  version: "1.0.0",
});

console.error(
  `[git-workflow-mcp] v1.0.0 loaded — repo: ${getRepoPath()} — tools: write_file, create_branch, commit_and_push`,
);

registerWorkflowTools(server);

const transport = new StdioServerTransport();
await server.connect(transport);
