import { useQuery } from '@tanstack/react-query'
import { xeroApi } from '@/api/xero'

export const xeroKeys = {
  status: ['xero', 'status'] as const,
  setup: ['xero', 'setup'] as const,
  contacts: ['xero', 'contacts'] as const,
  syncedContacts: ['xero', 'synced', 'contacts'] as const,
  syncedInvoices: ['xero', 'synced', 'invoices'] as const,
  webhookEvents: ['xero', 'webhooks', 'events'] as const,
  dbTest: ['xero', 'db-test'] as const,
}

export function useXeroStatus() {
  return useQuery({
    queryKey: xeroKeys.status,
    queryFn: xeroApi.status,
    staleTime: 15_000,
    retry: 1,
    refetchOnWindowFocus: false,
  })
}

export function useXeroSetup() {
  return useQuery({
    queryKey: xeroKeys.setup,
    queryFn: xeroApi.setup,
    staleTime: 60_000,
  })
}

export function useXeroContacts(enabled = true) {
  return useQuery({
    queryKey: xeroKeys.contacts,
    queryFn: () => xeroApi.contactsAll(),
    enabled,
    staleTime: 60_000,
  })
}

export function useSyncedContacts(enabled = true) {
  return useQuery({
    queryKey: xeroKeys.syncedContacts,
    queryFn: xeroApi.syncedContacts,
    enabled,
    staleTime: 30_000,
  })
}

export function useSyncedInvoices(enabled = true) {
  return useQuery({
    queryKey: xeroKeys.syncedInvoices,
    queryFn: xeroApi.syncedInvoices,
    enabled,
    staleTime: 30_000,
  })
}

export function useWebhookEvents(limit = 50) {
  return useQuery({
    queryKey: [...xeroKeys.webhookEvents, limit] as const,
    queryFn: () => xeroApi.webhookEvents(limit),
    staleTime: 15_000,
    refetchInterval: 15_000,
  })
}

export function useDbTest() {
  return useQuery({
    queryKey: xeroKeys.dbTest,
    queryFn: xeroApi.dbTest,
    staleTime: 60_000,
  })
}
