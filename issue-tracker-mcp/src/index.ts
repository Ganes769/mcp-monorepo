import { McpServer } from "@modelcontextprotocol/server";
import { createMcpHandler } from "agents/mcp/server";
import { registerIssueTrackerTools } from "./issue-tracker-tools";

const DEFAULT_API_BASE_URL = "https://mcp-monorepo-yccf.vercel.app/api";

function createServer(env: Env) {
	const server = new McpServer({
		name: "issue-tracker",
		version: "1.2.0",
	});

	registerIssueTrackerTools(server, {
		apiBaseUrl: env.API_BASE_URL || DEFAULT_API_BASE_URL,
		apiKey: env.ISSUES_API_KEY,
	});

	return server;
}

export default {
	fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const handler = createMcpHandler(() => createServer(env));
		return handler(request, env, ctx);
	},
} satisfies ExportedHandler<Env>;
