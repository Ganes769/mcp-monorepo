export const PRODUCTION_API_URL = "https://mcp-monorepo-yccf.vercel.app/api";

// Vercel project env often sets VITE_API_URL=/api for local-style proxying.
// That value must NOT be baked into production builds, or the SPA will call
// itself (mcp-monorepo.vercel.app/api/...) and get 404s for every API request.
const envUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
const isAbsoluteApiUrl = Boolean(envUrl && /^https?:\/\//i.test(envUrl));

export const API_BASE_URL = import.meta.env.PROD
  ? isAbsoluteApiUrl
    ? envUrl!
    : PRODUCTION_API_URL
  : envUrl || "/api";
