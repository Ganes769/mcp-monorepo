# Issue Tracker MCP (Cloudflare Workers)

**GitHub monorepo:** [https://github.com/Ganes769/mcp-monorepo](https://github.com/Ganes769/mcp-monorepo)  
**This package:** [`issue-tracker-mcp/`](https://github.com/Ganes769/mcp-monorepo/tree/main/issue-tracker-mcp)

Remote MCP server for the deployed Issue Tracker API — the AI skill layer that lets Claude / Cursor create and manage real issues.

Tools proxy to:

`https://mcp-monorepo-yccf.vercel.app/api`

### AI skill highlight

- Built with **Cursor** agents against a real Fastify + Turso backend
- Deployed on **Cloudflare Workers** as Streamable HTTP MCP (`/mcp`)
- Primary tool: **`create_issue`** (title, priority/severity, assignee, tags)
- Connect from **Claude web**, Claude Desktop, or Cursor via the URL below

For now, tools take **`apiKey` in chat** (paste your Issue Tracker API key when calling a tool).

Optional later: set Worker secret `ISSUES_API_KEY` / backend `MCP_SERVICE_TOKEN` so you don’t need to paste the key.

## Tools

- `create_issue` — apiKey, title, description, priority/severity, status, assignee, tag_names
- `list_issues`, `get_issue`, `update_issue`, `delete_issue` (all take apiKey)
- `list_users`, `list_tags`, `create_tag`, `health_status`

## Deployed MCP URL

```text
https://issue-tracker-mcp.ganesh-mcp.workers.dev/mcp
```

## Deploy / update

```bash
cd issue-tracker-mcp

# Point at the deployed API
npx wrangler secret put API_BASE_URL
# value: https://mcp-monorepo-yccf.vercel.app/api

# Same stable token as backend MCP_SERVICE_TOKEN (generate once; do not paste into chat)
# openssl rand -hex 32
npx wrangler secret put ISSUES_API_KEY

npx wrangler deploy
```

Also set on the **Vercel backend** project (once):

```env
MCP_SERVICE_TOKEN=<same value as ISSUES_API_KEY>
MCP_SERVICE_USER_EMAIL=<your login email on the issue tracker>
```


## Connect to Claude web (claude.ai)

Claude web only supports **remote** MCP connectors (not local `main.js`).

1. Open [https://claude.ai](https://claude.ai) and sign in
2. Go to **Settings** → **Connectors** (or **Customize** → **Connectors**)
3. Remove any old connector that still shows `add` / `calculate`
4. Click **+** → **Add custom connector**
5. Enter:
   - **Name:** `issue-tracker`
   - **URL:** `https://issue-tracker-mcp.ganesh-mcp.workers.dev/mcp`
6. Click **Add**, then **Connect** if prompted
7. Start a **new chat** and ask e.g.  
   “Create an issue titled ‘Fix login 401’ with high priority. Use apiKey `<paste-key>`”

Notes:
- Opening the URL in a browser may show `Method not allowed` — that is expected for GET.
- If Claude still shows calculator tools, disconnect/reconnect the connector and start a new chat.
- Free plans are usually limited to one custom connector.

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
