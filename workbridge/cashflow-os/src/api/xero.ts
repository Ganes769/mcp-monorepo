import { apiClient } from './client'
import {
  DB_TEST_PATH,
  XERO_CONTACTS_PATH,
  XERO_SETUP_PATH,
  XERO_STATUS_PATH,
  XERO_SYNCED_CONTACTS_PATH,
  XERO_SYNCED_INVOICES_PATH,
  XERO_WEBHOOK_EVENTS_PATH,
} from './config'
import { fetchXeroAuthorizeUrl, xeroLoginRedirectHref } from './auth'
import type {
  DbTest,
  XeroContactsResponse,
  XeroLoginUrl,
  XeroSetup,
  XeroStatus,
  XeroSyncedContactsResponse,
  XeroSyncedInvoicesResponse,
  XeroWebhookEventsResponse,
} from './types'

export const xeroLoginHref = xeroLoginRedirectHref

export const xeroApi = {
  status: async (): Promise<XeroStatus> => {
    const { data } = await apiClient.get<XeroStatus>(XERO_STATUS_PATH)
    return data
  },
  setup: async (): Promise<XeroSetup> => {
    const { data } = await apiClient.get<XeroSetup>(XERO_SETUP_PATH)
    return data
  },
  loginUrl: async (): Promise<XeroLoginUrl> => {
    const authorize_url = await fetchXeroAuthorizeUrl()
    return { authorize_url, instruction: 'Open authorize_url to sign in with Xero.' }
  },
  contacts: async (page = 1, pageSize = 100): Promise<XeroContactsResponse> => {
    const { data } = await apiClient.get<XeroContactsResponse>(XERO_CONTACTS_PATH, { params: { page, page_size: pageSize } })
    return data
  },
  contactsAll: async (): Promise<XeroContactsResponse> => {
    const pageSize = 100
    const contacts = []
    for (let page = 1; page <= 20; page += 1) {
      const batch = await xeroApi.contacts(page, pageSize)
      contacts.push(...(batch.contacts ?? []))
      if ((batch.contacts?.length ?? 0) < pageSize) break
    }
    return { count: contacts.length, contacts }
  },
  syncedContacts: async (): Promise<XeroSyncedContactsResponse> => {
    const { data } = await apiClient.get<XeroSyncedContactsResponse>(XERO_SYNCED_CONTACTS_PATH)
    return data
  },
  syncedInvoices: async (): Promise<XeroSyncedInvoicesResponse> => {
    const { data } = await apiClient.get<XeroSyncedInvoicesResponse>(XERO_SYNCED_INVOICES_PATH)
    return data
  },
  webhookEvents: async (limit = 50): Promise<XeroWebhookEventsResponse> => {
    const { data } = await apiClient.get<XeroWebhookEventsResponse>(XERO_WEBHOOK_EVENTS_PATH, { params: { limit } })
    return data
  },
  dbTest: async (): Promise<DbTest> => {
    const { data } = await apiClient.get<DbTest>(DB_TEST_PATH)
    return data
  },
}
