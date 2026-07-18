export const PRODUCTION_API_URL =
  "https://mcp-monorepo-dx7n.vercel.app/api";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? PRODUCTION_API_URL : "/api");
