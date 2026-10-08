/** Deployed Cashflow Agent API: https://cash-flow-5gdu.onrender.com/ */
export const CASHFLOW_API_ORIGIN = (import.meta.env.VITE_API_BASE_URL ?? 'https://cash-flow-5gdu.onrender.com').replace(
  /\/$/,
  '',
)

/**
 * Axios base URL.
 * In Vite dev, stay same-origin so `/xero` and `/db-test` are proxied to Render
 * (the API CORS list does not include every local port).
 */
export const API_BASE_URL = (import.meta.env.DEV ? '' : CASHFLOW_API_ORIGIN).replace(/\/$/, '')

export const DB_TEST_PATH = '/db-test'
export const XERO_LOGIN_PATH = '/xero/login'
export const XERO_LOGIN_URL_PATH = '/xero/login/url'
export const XERO_CALLBACK_PATH = '/xero/callback'
export const XERO_STATUS_PATH = '/xero/status'
export const XERO_SETUP_PATH = '/xero/setup'
export const XERO_CONTACTS_PATH = '/xero/contacts'
export const XERO_INVOICES_PATH = '/xero/invoices'
export const XERO_SYNC_PATH = '/xero/sync'
export const XERO_WEBHOOKS_PATH = '/xero/webhooks'
export const XERO_WEBHOOK_EVENTS_PATH = '/xero/webhooks/events'
export const XERO_SYNCED_CONTACTS_PATH = '/xero/synced/contacts'
export const XERO_SYNCED_INVOICES_PATH = '/xero/synced/invoices'

export function apiUrl(path: string): string {
  const normalised = path.startsWith('/') ? path : `/${path}`
  if (API_BASE_URL) return `${API_BASE_URL}${normalised}`
  return normalised
}

export function cashflowApiUrl(path: string): string {
  const normalised = path.startsWith('/') ? path : `/${path}`
  return `${CASHFLOW_API_ORIGIN}${normalised}`
}
