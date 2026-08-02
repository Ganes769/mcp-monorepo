// Prefer same-origin `/api` in production (see frontend/vercel.json rewrite).
// That keeps session cookies first-party. Absolute URLs still work as an
// override via VITE_API_URL, but require SameSite=None cookies on the API.
export const PRODUCTION_API_URL = "/api";

const envUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
const isAbsoluteApiUrl = Boolean(envUrl && /^https?:\/\//i.test(envUrl));

export const API_BASE_URL = import.meta.env.PROD
  ? isAbsoluteApiUrl
    ? envUrl!
    : PRODUCTION_API_URL
  : envUrl || "/api";

/** Remote Issue Tracker MCP endpoint (Cloudflare Workers) for Claude / Cursor */
export const MCP_SERVER_URL =
  "https://issue-tracker-mcp.ganesh-mcp.workers.dev/mcp";

export const GITHUB_REPO_URL = "https://github.com/Ganes769/mcp-monorepo";
