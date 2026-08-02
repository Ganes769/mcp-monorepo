# Issue Tracker MCP (Cloudflare Workers)

Remote MCP server for the deployed Issue Tracker API. Tools proxy to:

`https://mcp-monorepo-yccf.vercel.app/api`

## Tools

- `issues-list`, `issues-create`, `issues-get`, `issues-update`, `issues-delete`
- `tags-list`, `tags-create`, `tags-delete`
- `users-list`, `api-key-verify`, `health-status`

Most tools require an `apiKey` from the Issue Tracker web app (sign in → create API key).

## Deployed MCP URL

```text
https://issue-tracker-mcp.ganesh-mcp.workers.dev/mcp
```

## Deploy / update

```bash
cd issue-tracker-mcp
npx wrangler secret put API_BASE_URL
# value: https://mcp-monorepo-yccf.vercel.app/api

npx wrangler deploy
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
6. Start a **new chat** and ask Claude to use a tool, e.g.  
   “List issues using apiKey `<your-key>`”

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
