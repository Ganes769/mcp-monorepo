import { apiClient } from './client'
import {
  DB_TEST_PATH,
  XERO_CONTACTS_PATH,
  XERO_INVOICES_PATH,
  XERO_SETUP_PATH,
  XERO_STATUS_PATH,
  XERO_SYNC_PATH,
  XERO_SYNCED_CONTACTS_PATH,
  XERO_SYNCED_INVOICES_PATH,
  XERO_WEBHOOK_EVENTS_PATH,
} from './config'
import { startXeroLogin } from './auth'
import type {
  DbTest,
  XeroContactsResponse,
  XeroInvoicesResponse,
  XeroSetup,
  XeroStatus,
  XeroSyncResponse,
  XeroSyncedContactsResponse,
  XeroSyncedInvoicesResponse,
  XeroWebhookEventsResponse,
} from './types'

const LONG_PULL = { timeout: 120_000 }

export const xeroApi = {
  status: async (): Promise<XeroStatus> => {
    const { data } = await apiClient.get<XeroStatus>(XERO_STATUS_PATH, {
      headers: { Accept: 'application/json' },
    })
    return data
  },
  setup: async (): Promise<XeroSetup> => {
    const { data } = await apiClient.get<XeroSetup>(XERO_SETUP_PATH)
    return data
  },
  startLogin: startXeroLogin,
  contacts: async (page = 1, pageSize = 100): Promise<XeroContactsResponse> => {
    const { data } = await apiClient.get<XeroContactsResponse>(XERO_CONTACTS_PATH, {
      params: { page, page_size: pageSize },
      ...LONG_PULL,
    })
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
  invoices: async (page = 1, pageSize = 100): Promise<XeroInvoicesResponse> => {
    const { data } = await apiClient.get<XeroInvoicesResponse>(XERO_INVOICES_PATH, {
      params: { page, page_size: pageSize },
      ...LONG_PULL,
    })
    return data
  },
  invoicesAll: async (): Promise<XeroInvoicesResponse> => {
    const pageSize = 100
    const invoices = []
    for (let page = 1; page <= 20; page += 1) {
      const batch = await xeroApi.invoices(page, pageSize)
      invoices.push(...(batch.invoices ?? []))
      if ((batch.invoices?.length ?? 0) < pageSize) break
    }
    return { count: invoices.length, invoices }
  },
  importFromXero: async () => {
    const [contacts, invoices] = await Promise.all([xeroApi.contactsAll(), xeroApi.invoicesAll()])
    return { contacts: contacts.count, invoices: invoices.count }
  },
  sync: async (full = true): Promise<XeroSyncResponse> => {
    const { data } = await apiClient.post<XeroSyncResponse>(XERO_SYNC_PATH, null, {
      params: { full },
      ...LONG_PULL,
    })
    return data
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
