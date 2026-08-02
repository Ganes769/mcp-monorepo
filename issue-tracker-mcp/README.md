# Building a Remote MCP Server on Cloudflare (Without Auth)

This example allows you to deploy a stateless remote MCP server that doesn't require authentication on Cloudflare Workers. It implements the MCP 2026-07-28 specification while remaining compatible with legacy clients for ordinary tool calls.

## Get started:

[![Deploy to Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cloudflare/ai/tree/main/demos/remote-mcp-authless)

This will deploy your MCP server to a URL like: `remote-mcp-server-authless.<your-account>.workers.dev/mcp`

Alternatively, you can use the command line below to get the remote MCP Server created on your local machine:

```bash
npm create cloudflare@latest -- my-mcp-server --template=cloudflare/ai/demos/remote-mcp-authless
```

## Customizing your MCP Server

To add your own [tools](https://developers.cloudflare.com/agents/model-context-protocol/protocol/tools/) to the MCP server, register each tool on the `McpServer` created in the `createServer()` function in `src/index.ts` using `server.registerTool(...)`.

## Deployed MCP URL

```text
https://issue-tracker-mcp.ganesh-mcp.workers.dev/mcp
```

## Connect to Claude web (claude.ai)

Claude web only supports **remote** MCP connectors (not local `main.js`).

1. Open [https://claude.ai](https://claude.ai) and sign in
2. Go to **Settings** → **Connectors** (or **Customize** → **Connectors**)
3. Click **+** → **Add custom connector**
4. Enter:
   - **Name:** `issue-tracker`
   - **URL:** `https://issue-tracker-mcp.ganesh-mcp.workers.dev/mcp`
5. Click **Add**, then **Connect** if prompted
6. Start a **new chat** and ask Claude to use a tool (e.g. “Use the add tool to add 2 and 3”)

Notes:
- Opening the URL in a browser may show `Method not allowed` — that is expected for GET. Use Claude or the playground instead.
- Free plans are usually limited to one custom connector.
- On Team/Enterprise, an admin may need to add the connector first.

## Connect to Cloudflare AI Playground

1. Go to https://playground.ai.cloudflare.com/
2. Enter: `https://issue-tracker-mcp.ganesh-mcp.workers.dev/mcp`
3. Use the available MCP tools from the playground

## Connect Claude Desktop to your MCP server

### Option A — Remote Worker (same URL as Claude web)

In Claude Desktop go to **Settings → Developer → Edit Config** and add:

```json
{
	"mcpServers": {
		"issue-tracker": {
			"command": "npx",
			"args": [
				"mcp-remote",
				"https://issue-tracker-mcp.ganesh-mcp.workers.dev/mcp"
			]
		}
	}
}
```

Fully quit and reopen Claude Desktop. Tools should appear under the tools/hammer icon.

### Option B — Local MCP (stdio)

Point Claude Desktop at the local issue-tracker MCP and your deployed API:

```json
{
	"mcpServers": {
		"issue-tracker": {
			"command": "/usr/local/bin/node",
			"args": ["/Volumes/GaNesh/my-mcp/mcp-issue-tracker/mcp/main.js"],
			"env": {
				"API_BASE_URL": "https://mcp-monorepo-yccf.vercel.app/api",
				"NODE_OPTIONS": "--no-deprecation"
			}
		}
	}
}
```

Run `npm install` inside `mcp-issue-tracker/mcp` first if dependencies are missing.
