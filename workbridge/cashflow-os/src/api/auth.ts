import { apiClient, ApiError } from './client'
import {
  CASHFLOW_API_ORIGIN,
  XERO_CALLBACK_PATH,
  XERO_LOGIN_PATH,
  XERO_LOGIN_URL_PATH,
  XERO_STATUS_PATH,
  apiUrl,
} from './config'
import { persistAuthSession } from './session'
import type { XeroLoginUrl, XeroStatus } from './types'

/** Scopes this Xero web app currently grants. Extra ones cause invalid_scope. */
const GRANTED_SCOPES = [
  'offline_access',
  'openid',
  'profile',
  'email',
  'accounting.contacts.read',
  'accounting.transactions.read',
]

export function isXeroConnected(status?: XeroStatus | null): boolean {
  return Boolean(status?.connected && status.token_valid)
}

/** Browser redirect to Xero. Do not add extra query params — Xero rejects them. */
export function xeroLoginRedirectHref(): string {
  const href = apiUrl(XERO_LOGIN_PATH)
  if (href.startsWith('http')) return href
  if (typeof window !== 'undefined') return `${window.location.origin}${href}`
  return `${CASHFLOW_API_ORIGIN}${XERO_LOGIN_PATH}`
}

export function sanitizeXeroAuthorizeUrl(authorizeUrl: string): string {
  const url = new URL(authorizeUrl)
  const requested = (url.searchParams.get('scope') || '').split(/[+\s]+/).filter(Boolean)
  const granted = requested.filter((scope) => GRANTED_SCOPES.includes(scope))
  if (granted.length > 0) url.searchParams.set('scope', granted.join(' '))
  return url.toString()
}

export async function fetchXeroAuthorizeUrl(): Promise<string> {
  const { data } = await apiClient.get<XeroLoginUrl>(XERO_LOGIN_URL_PATH)
  if (!data?.authorize_url) {
    throw new ApiError('Xero did not return an authorize URL.', 502)
  }
  return sanitizeXeroAuthorizeUrl(data.authorize_url)
}

export async function resolveXeroLoginHref(): Promise<{ href: string; source: 'login_redirect' | 'login_url' }> {
  const href = await fetchXeroAuthorizeUrl()
  return { href, source: 'login_url' }
}

export async function completeXeroCallback(code: string, state: string | null): Promise<void> {
  await apiClient.get(XERO_CALLBACK_PATH, {
    params: { code, state },
    validateStatus: (status) => status < 400 || status === 302,
  })
}

export async function fetchXeroSession(): Promise<XeroStatus> {
  const { data } = await apiClient.get<XeroStatus>(XERO_STATUS_PATH)
  return data
}

export function markSignedIn(): void {
  persistAuthSession()
}
