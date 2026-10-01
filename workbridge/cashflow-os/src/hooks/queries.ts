import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ApprovalStatus, CollectionRange, FollowUpStatus } from '@/types'
import * as invoiceService from '@/services/invoiceService'
import * as customerService from '@/services/customerService'
import * as approvalService from '@/services/approvalService'
import * as agentService from '@/services/agentService'
import * as analyticsService from '@/services/analyticsService'
import * as followUpService from '@/services/followUpService'
import * as settingsService from '@/services/settingsService'

export const queryKeys = {
  overview: ['overview'] as const,
  collections: (range: CollectionRange) => ['collections', range] as const,
  riskDistribution: ['risk-distribution'] as const,
  analytics: ['analytics'] as const,
  invoices: ['invoices'] as const,
  invoice: (id: string) => ['invoices', id] as const,
  customers: ['customers'] as const,
  customer: (id: string) => ['customers', id] as const,
  approvals: (status?: ApprovalStatus) => ['approvals', status ?? 'all'] as const,
  investigations: ['investigations'] as const,
  investigation: (invoiceId: string) => ['investigations', invoiceId] as const,
  agentActivity: ['agent-activity'] as const,
  followUps: ['follow-ups'] as const,
  settings: ['settings'] as const,
  notifications: ['notifications'] as const,
  search: (q: string) => ['search', q] as const,
}

export const useOverview = () => useQuery({ queryKey: queryKeys.overview, queryFn: analyticsService.getOverview })
export const useCollections = (range: CollectionRange) =>
  useQuery({ queryKey: queryKeys.collections(range), queryFn: () => analyticsService.getCollections(range), placeholderData: (prev) => prev })
export const useRiskDistribution = () => useQuery({ queryKey: queryKeys.riskDistribution, queryFn: analyticsService.getRiskDistribution })
export const useAnalytics = () => useQuery({ queryKey: queryKeys.analytics, queryFn: analyticsService.getAnalytics })

export const useInvoices = () => useQuery({ queryKey: queryKeys.invoices, queryFn: invoiceService.getInvoices })
export const useInvoice = (id: string) => useQuery({ queryKey: queryKeys.invoice(id), queryFn: () => invoiceService.getInvoice(id) })

export const useCustomers = () => useQuery({ queryKey: queryKeys.customers, queryFn: customerService.getCustomers })
export const useCustomer = (id: string) => useQuery({ queryKey: queryKeys.customer(id), queryFn: () => customerService.getCustomer(id) })

export const useApprovals = (status?: ApprovalStatus) =>
  useQuery({ queryKey: queryKeys.approvals(status), queryFn: () => approvalService.getApprovals(status) })

export const useInvestigations = () =>
  useQuery({
    queryKey: queryKeys.investigations,
    queryFn: agentService.getInvestigations,
    refetchInterval: (query) => (query.state.data?.some((i) => i.live) ? 1_000 : false),
  })

/** Polls while the simulated agent is running so the timeline updates step by step. */
export const useInvestigation = (invoiceId: string) =>
  useQuery({
    queryKey: queryKeys.investigation(invoiceId),
    queryFn: () => agentService.getInvestigation(invoiceId),
    refetchInterval: (query) => (query.state.data?.state === 'running' ? 500 : false),
  })

export const useAgentActivity = () => useQuery({ queryKey: queryKeys.agentActivity, queryFn: agentService.getAgentActivity, refetchInterval: 3_000 })
export const useFollowUps = () => useQuery({ queryKey: queryKeys.followUps, queryFn: followUpService.getFollowUps })
export const useSettings = () => useQuery({ queryKey: queryKeys.settings, queryFn: settingsService.getSettings })
export const useNotifications = () => useQuery({ queryKey: queryKeys.notifications, queryFn: settingsService.getNotifications })

export const useSearch = (q: string) =>
  useQuery({ queryKey: queryKeys.search(q), queryFn: () => invoiceService.search(q), enabled: q.trim().length > 0, placeholderData: (prev) => prev })

/**
 * Mutations change several related views (invoice, approvals, follow-ups, KPIs, agent feed),
 * so they invalidate everything; the mock layer is cheap and this mirrors a real backend
 * where one approval touches many resources.
 */
function useInvalidateAll() {
  const client = useQueryClient()
  return () => client.invalidateQueries()
}

export function useApproveAction() {
  const invalidate = useInvalidateAll()
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & approvalService.ApproveInput) => approvalService.approveAction(id, input),
    onSettled: invalidate,
  })
}

export function useRejectAction() {
  const invalidate = useInvalidateAll()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => approvalService.rejectAction(id, reason),
    onSettled: invalidate,
  })
}

export function useStartInvestigation() {
  const invalidate = useInvalidateAll()
  return useMutation({ mutationFn: agentService.startInvestigation, onSettled: invalidate })
}

export function useUpdateFollowUp() {
  const invalidate = useInvalidateAll()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: FollowUpStatus }) => followUpService.updateFollowUpStatus(id, status),
    onSettled: invalidate,
  })
}

export function useMarkNotificationsRead() {
  const invalidate = useInvalidateAll()
  return useMutation({ mutationFn: settingsService.markNotificationsRead, onSettled: invalidate })
}
