# mcp-monorepo

**GitHub:** [https://github.com/Ganes769/mcp-monorepo](https://github.com/Ganes769/mcp-monorepo)

Full-stack **Issue Tracker** plus **MCP servers** so AI agents (Claude, Cursor) can create, update, and triage issues against a real deployed API.

---

## Highlight: AI + MCP skill

This repo is built around **AI-native tooling**:

- Built and iterated with **Cursor** (agent-assisted full-stack development)
- Exposes a remote **Model Context Protocol (MCP)** server so Claude / Cursor can call real product tools (`create_issue`, `list_issues`, assign, priority, tags)
- Connects AI assistants to a live production API — not a toy calculator demo
- Demonstrates practical **human + AI workflows**: UI for people, MCP tools for agents

---

## Issue Tracker (main app)

| | URL |
|---|---|
| **Live app** | [https://mcp-monorepo.vercel.app](https://mcp-monorepo.vercel.app) |
| **API** | [https://mcp-monorepo-yccf.vercel.app/api](https://mcp-monorepo-yccf.vercel.app/api) |
| **Source** | [`mcp-issue-tracker/`](./mcp-issue-tracker) |
| **Repo** | [github.com/Ganes769/mcp-monorepo](https://github.com/Ganes769/mcp-monorepo) |

Stack: React · Fastify · Better Auth · Turso · Vercel

Features: auth, issues CRUD, tags, filtering, assignees, API keys for MCP clients.

---

## Issue Tracker MCP (Cloudflare)

Remote MCP Worker that proxies tool calls to the deployed Issue Tracker API.

| | URL |
|---|---|
| **MCP endpoint** | [https://issue-tracker-mcp.ganesh-mcp.workers.dev/mcp](https://issue-tracker-mcp.ganesh-mcp.workers.dev/mcp) |
| **Source** | [`issue-tracker-mcp/`](./issue-tracker-mcp) |
| **Docs** | [`issue-tracker-mcp/README.md`](./issue-tracker-mcp/README.md) |

### Tools

- `create_issue` — title, description, priority/severity, status, assignee, tags (+ `apiKey`)
- `list_issues`, `get_issue`, `update_issue`, `delete_issue`
- `list_users`, `list_tags`, `create_tag`, `health_status`

### Connect in Claude web

1. [claude.ai](https://claude.ai) → **Settings → Connectors**
2. Remove any old connector that still shows `add` / `calculate`
3. **Add custom connector**
   - Name: `issue-tracker-v2`
   - URL: `https://issue-tracker-mcp.ganesh-mcp.workers.dev/mcp`
4. New chat → ask Claude to `create_issue` (pass your app API key)

### Connect in Claude Desktop / Cursor

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

---

## Other packages in this monorepo

| Package | Path | Role |
|---|---|---|
| Issue Tracker app | [`mcp-issue-tracker/`](./mcp-issue-tracker) | Full-stack web app + local stdio MCP |
| Issue Tracker MCP (remote) | [`issue-tracker-mcp/`](./issue-tracker-mcp) | Cloudflare Workers MCP for Claude/Cursor |
| GitHub MCP | [`github-mcp/`](./github-mcp) | Local MCP tools for GitHub workflows |
| Git workflow MCP | [`git-workflow-mcp/`](./git-workflow-mcp) | Local git helper MCP |

---

## Quick start (local app)

```bash
git clone https://github.com/Ganes769/mcp-monorepo.git
cd mcp-monorepo/mcp-issue-tracker
npm install
npm run dev
```

See [`mcp-issue-tracker/README.md`](./mcp-issue-tracker/README.md) for env setup, migrations, and tests.
