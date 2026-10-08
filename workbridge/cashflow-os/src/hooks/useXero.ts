import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { xeroApi } from '@/api/xero'
import { queryKeys } from '@/hooks/queries'

export const LIVE_POLL_MS = 9_000

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
    staleTime: 5_000,
    retry: 1,
    refetchInterval: LIVE_POLL_MS,
    refetchOnWindowFocus: true,
  })
}

export function useXeroSetup() {
  return useQuery({
    queryKey: xeroKeys.setup,
    queryFn: xeroApi.setup,
    staleTime: 60_000,
  })
}

export function useSyncedContacts(enabled = true) {
  return useQuery({
    queryKey: xeroKeys.syncedContacts,
    queryFn: xeroApi.syncedContacts,
    enabled,
    staleTime: 5_000,
    refetchInterval: enabled ? LIVE_POLL_MS : false,
    refetchOnWindowFocus: true,
    placeholderData: (previous) => previous,
  })
}

export function useSyncedInvoices(enabled = true) {
  return useQuery({
    queryKey: xeroKeys.syncedInvoices,
    queryFn: xeroApi.syncedInvoices,
    enabled,
    staleTime: 5_000,
    refetchInterval: enabled ? LIVE_POLL_MS : false,
    refetchOnWindowFocus: true,
    placeholderData: (previous) => previous,
  })
}

export function useXeroContacts(enabled = true) {
  return useSyncedContacts(enabled)
}

function invalidateLive(client: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    client.invalidateQueries({ queryKey: xeroKeys.status }),
    client.invalidateQueries({ queryKey: xeroKeys.syncedContacts }),
    client.invalidateQueries({ queryKey: xeroKeys.syncedInvoices }),
    client.invalidateQueries({ queryKey: queryKeys.invoices }),
    client.invalidateQueries({ queryKey: queryKeys.customers }),
    client.invalidateQueries({ queryKey: queryKeys.overview }),
  ])
}

export function useXeroSync() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: () => xeroApi.sync(true),
    onSettled: () => invalidateLive(client),
  })
}

export function useXeroImport() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: xeroApi.importFromXero,
    onSettled: () => invalidateLive(client),
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
