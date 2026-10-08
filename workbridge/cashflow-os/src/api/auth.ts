import { apiClient, ApiError } from "./client";
import {
  CASHFLOW_API_ORIGIN,
  XERO_LOGIN_URL_PATH,
  XERO_STATUS_PATH,
} from "./config";
import { persistAuthSession } from "./session";
import type { XeroLoginUrl, XeroStatus } from "./types";

/** Scopes this Xero web app currently grants. Extra ones cause invalid_scope. */
const GRANTED_SCOPES = [
  "offline_access",
  "openid",
  "profile",
  "email",
  "accounting.contacts.read",
];

export function isXeroConnected(status?: XeroStatus | null): boolean {
  return Boolean(status?.connected && status.token_valid);
}

export function sanitizeXeroAuthorizeUrl(authorizeUrl: string): string {
  const url = new URL(authorizeUrl);
  const requested = (url.searchParams.get("scope") || "")
    .split(/[+\s]+/)
    .filter(Boolean);
  const granted = requested.filter((scope) => GRANTED_SCOPES.includes(scope));
  if (granted.length > 0) url.searchParams.set("scope", granted.join(" "));
  return url.toString();
}

/** JSON login URL only — never fetch /xero/login, that endpoint redirects. */
export async function fetchSanitizedAuthorizeUrl(): Promise<string> {
  const { data } = await apiClient.get<XeroLoginUrl>(XERO_LOGIN_URL_PATH);
  if (!data?.authorize_url) {
    throw new ApiError("Xero did not return an authorize URL.", 502);
  }
  return sanitizeXeroAuthorizeUrl(data.authorize_url);
}

/** Same-tab redirect to Xero with granted scopes only. */
export async function startXeroLogin(): Promise<void> {
  const href = await fetchSanitizedAuthorizeUrl();
  window.location.assign(href);
}

export async function fetchXeroSession(): Promise<XeroStatus> {
  const { data } = await apiClient.get<XeroStatus>(XERO_STATUS_PATH, {
    headers: { Accept: "application/json" },
  });
  return data;
}

export function markSignedIn(): void {
  persistAuthSession();
}

export { CASHFLOW_API_ORIGIN };
