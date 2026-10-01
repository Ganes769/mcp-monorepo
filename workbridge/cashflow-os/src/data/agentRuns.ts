import type { AgentAction, AgentDailyStats, AgentEvent, AgentRun } from '@/types'

/** Aggregate counters for today, as the agent orchestrator would report them. */
export const agentDailyStats: AgentDailyStats = {
  runsToday: 84,
  successful: 78,
  waiting: 4,
  failed: 2,
  automatedActions: 61,
}

export const agentRuns: AgentRun[] = [
  { id: 'run_1052', invoiceId: 'inv-48256', startedAt: '2026-09-28T10:52:30', durationSeconds: 14, status: 'running', summary: 'Triage in progress', toolCalls: 1 },
  { id: 'run_1051', invoiceId: 'inv-48155', startedAt: '2026-09-28T10:51:02', durationSeconds: 42, status: 'running', summary: 'Collecting evidence', toolCalls: 3 },
  { id: 'run_1049', invoiceId: 'inv-48121', startedAt: '2026-09-28T10:49:40', durationSeconds: 56, status: 'running', summary: 'Analysing customer communications', toolCalls: 4 },
  { id: 'run_1047', invoiceId: 'inv-48233', startedAt: '2026-09-28T10:47:15', durationSeconds: 70, status: 'running', summary: 'Comparing previous invoices', toolCalls: 5 },
  { id: 'run_1042', invoiceId: 'inv-48291', startedAt: '2026-09-28T10:42:11', durationSeconds: 21, status: 'waiting', summary: 'Missing PO reference — waiting for approval', toolCalls: 6 },
  { id: 'run_1038', invoiceId: 'inv-48284', startedAt: '2026-09-28T10:20:48', durationSeconds: 9, status: 'succeeded', summary: 'Friendly reminder sent automatically', toolCalls: 3 },
  { id: 'run_1031', invoiceId: 'inv-48112', startedAt: '2026-09-28T09:58:40', durationSeconds: 34, status: 'waiting', summary: 'Active dispute — needs review', toolCalls: 6 },
  { id: 'run_1027', invoiceId: 'inv-48259', startedAt: '2026-09-28T09:44:03', durationSeconds: 12, status: 'failed', summary: 'Email search timed out after 3 retries', toolCalls: 4 },
  { id: 'run_1024', invoiceId: 'inv-48140', startedAt: '2026-09-28T09:31:02', durationSeconds: 28, status: 'waiting', summary: 'Signed variation found — waiting for approval', toolCalls: 6 },
  { id: 'run_1019', invoiceId: 'inv-48177', startedAt: '2026-09-28T09:12:55', durationSeconds: 25, status: 'waiting', summary: 'Payment plan drafted — waiting for approval', toolCalls: 5 },
  { id: 'run_1012', invoiceId: 'inv-48270', startedAt: '2026-09-28T08:58:21', durationSeconds: 8, status: 'succeeded', summary: 'Friendly reminder sent automatically', toolCalls: 3 },
  { id: 'run_1006', invoiceId: 'inv-48240', startedAt: '2026-09-28T08:47:19', durationSeconds: 17, status: 'succeeded', summary: 'Entity mismatch found — approval requested', toolCalls: 5 },
  { id: 'run_0998', invoiceId: 'inv-48248', startedAt: '2026-09-28T08:12:40', durationSeconds: 11, status: 'failed', summary: 'Xero sync unavailable (demo) — will retry', toolCalls: 1 },
]

export const agentActions: AgentAction[] = [
  { id: 'act_1', runId: 'run_1042', type: 'reissue_invoice', status: 'proposed', description: 'Reissue INV-48291 with PO-8821 and email to Hannah Price' },
  { id: 'act_2', runId: 'run_1038', type: 'send_email', status: 'executed', description: 'Friendly reminder for INV-48284' },
  { id: 'act_3', runId: 'run_1012', type: 'send_email', status: 'executed', description: 'Friendly reminder for INV-48270' },
]

/** Today's event stream, newest first. */
export const agentEvents: AgentEvent[] = [
  { id: 'ev_30', at: '2026-09-28T10:52:31', kind: 'tool_call', title: 'Retrieved invoice', invoiceNumber: 'INV-48256', tool: 'get_invoice' },
  { id: 'ev_29', at: '2026-09-28T10:52:30', kind: 'action', title: 'Agent started investigation', invoiceNumber: 'INV-48256' },
  { id: 'ev_28', at: '2026-09-28T10:51:19', kind: 'tool_call', title: 'Checked payment history', invoiceNumber: 'INV-48155', tool: 'get_payment_history', detail: 'Last 3 payments: 9, 14, 19 days late' },
  { id: 'ev_27', at: '2026-09-28T10:51:02', kind: 'action', title: 'Agent started investigation', invoiceNumber: 'INV-48155' },
  { id: 'ev_26', at: '2026-09-28T10:50:12', kind: 'tool_call', title: 'Searched customer communications', invoiceNumber: 'INV-48121', tool: 'search_customer_emails', detail: '5 emails found' },
  { id: 'ev_25', at: '2026-09-28T10:48:30', kind: 'tool_call', title: 'Compared previous invoices', invoiceNumber: 'INV-48233', tool: 'compare_invoices' },
  { id: 'ev_07', at: '2026-09-28T10:42:32', kind: 'approval', title: 'Waiting for human approval', invoiceNumber: 'INV-48291', detail: 'Send corrected invoice with PO reference' },
  { id: 'ev_06', at: '2026-09-28T10:42:30', kind: 'decision', title: 'Generated recommended action', invoiceNumber: 'INV-48291', tool: 'draft_action', detail: 'Send corrected invoice with PO reference · 91% confidence' },
  { id: 'ev_05', at: '2026-09-28T10:42:27', kind: 'decision', title: 'Detected missing PO reference', invoiceNumber: 'INV-48291', detail: 'Customer requires PO; invoice has none' },
  { id: 'ev_04', at: '2026-09-28T10:42:19', kind: 'tool_call', title: 'Searched customer communications', invoiceNumber: 'INV-48291', tool: 'search_customer_emails', detail: '7 emails searched' },
  { id: 'ev_03', at: '2026-09-28T10:42:15', kind: 'tool_call', title: 'Retrieved customer history', invoiceNumber: 'INV-48291', tool: 'get_customer' },
  { id: 'ev_02', at: '2026-09-28T10:42:13', kind: 'tool_call', title: 'Retrieved invoice', invoiceNumber: 'INV-48291', tool: 'get_invoice' },
  { id: 'ev_01', at: '2026-09-28T10:42:11', kind: 'action', title: 'Agent started investigation', invoiceNumber: 'INV-48291' },
  { id: 'ev_20', at: '2026-09-28T10:20:57', kind: 'success', title: 'Friendly reminder sent automatically', invoiceNumber: 'INV-48284', detail: 'Low risk · within auto-send policy' },
  { id: 'ev_19', at: '2026-09-28T09:59:14', kind: 'approval', title: 'Review requested — active dispute', invoiceNumber: 'INV-48112' },
  { id: 'ev_18', at: '2026-09-28T09:44:15', kind: 'error', title: 'Email search timed out after 3 retries', invoiceNumber: 'INV-48259', tool: 'search_customer_emails' },
  { id: 'ev_17', at: '2026-09-28T09:31:30', kind: 'approval', title: 'Waiting for human approval', invoiceNumber: 'INV-48140' },
  { id: 'ev_16', at: '2026-09-28T09:13:20', kind: 'approval', title: 'Waiting for human approval', invoiceNumber: 'INV-48177' },
  { id: 'ev_15', at: '2026-09-28T08:58:29', kind: 'success', title: 'Friendly reminder sent automatically', invoiceNumber: 'INV-48270' },
  { id: 'ev_14', at: '2026-09-28T08:12:51', kind: 'error', title: 'Xero sync unavailable (demo) — will retry', invoiceNumber: 'INV-48248' },
]
