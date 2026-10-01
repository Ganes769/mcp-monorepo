import type { Approval, ApprovalStatus, ApprovalWithInvoice, Communication } from '@/types'
import { DEMO_TODAY, addDays, demoNow } from '@/lib/dates'
import { currentUser } from '@/data/settings'
import { NotFoundError, db, latency, nextId } from './mockDb'
import { toRow } from './invoiceService'

const FOLLOW_UP_AFTER_DAYS = 2

function withInvoice(approval: Approval): ApprovalWithInvoice {
  const invoice = db.invoices.find((i) => i.id === approval.invoiceId)
  if (!invoice) throw new NotFoundError('Invoice', approval.invoiceId)
  const investigation = db.investigations.find((i) => i.invoiceId === approval.invoiceId)
  return { ...approval, invoice: toRow(invoice), finding: investigation?.finding ?? null }
}

function findPending(id: string): Approval {
  const approval = db.approvals.find((a) => a.id === id)
  if (!approval) throw new NotFoundError('Approval', id)
  if (approval.status !== 'pending') throw new Error(`Approval ${id} has already been ${approval.status}`)
  return approval
}

function timeline(approval: Approval, entries: Array<Pick<Communication, 'channel' | 'direction' | 'title' | 'body'>>) {
  const invoice = db.invoices.find((i) => i.id === approval.invoiceId)!
  const at = demoNow()
  for (const entry of entries) {
    db.communications.push({ id: nextId('com'), customerId: invoice.customerId, invoiceId: invoice.id, at, ...entry })
  }
}

/** A human decision closes the agent run that was waiting on it. */
function settleRun(invoiceId: string, summary: string) {
  const run = db.agentRuns.find((r) => r.invoiceId === invoiceId && r.status === 'waiting')
  if (!run) return
  run.status = 'succeeded'
  run.summary = summary
  db.agentStats.waiting = Math.max(0, db.agentStats.waiting - 1)
  db.agentStats.successful += 1
}

/** Future: GET /api/approvals?status= */
export async function getApprovals(status?: ApprovalStatus): Promise<ApprovalWithInvoice[]> {
  await latency()
  return db.approvals
    .filter((a) => !status || a.status === status)
    .map(withInvoice)
    .sort((a, b) => (a.priority === b.priority ? b.createdAt.localeCompare(a.createdAt) : a.priority === 'high' ? -1 : 1))
}

export interface ApproveInput {
  /** Edited draft, if the reviewer changed the AI's proposed message */
  draft?: string
  note?: string
}

/** Future: POST /api/approvals/:id/approve */
export async function approveAction(id: string, input: ApproveInput = {}): Promise<ApprovalWithInvoice> {
  await latency(600)
  const approval = findPending(id)
  if (approval.action.approvalMode === 'review_required') {
    throw new Error('This action needs a full review on the invoice page before it can be approved.')
  }
  const invoice = db.invoices.find((i) => i.id === approval.invoiceId)!
  const at = demoNow()
  const edited = input.draft !== undefined && input.draft !== approval.action.draft

  approval.status = 'approved'
  approval.decidedAt = at
  approval.decidedBy = currentUser.name
  approval.note = input.note
  if (edited) approval.action = { ...approval.action, draft: input.draft! }

  invoice.aiStatus = 'action_executed'
  invoice.lastAction = { label: approval.action.title, at: DEMO_TODAY }
  const investigation = db.investigations.find((i) => i.invoiceId === invoice.id)
  if (investigation) {
    investigation.stage = 'verify_payment'
    investigation.currentStep = 'Watching for payment'
  }

  const followUpDate = addDays(DEMO_TODAY, FOLLOW_UP_AFTER_DAYS)
  db.followUps.unshift({
    id: nextId('fu'),
    invoiceId: invoice.id,
    customerId: invoice.customerId,
    dueAt: followUpDate,
    reason: `Waiting for payment after: ${approval.action.title.toLowerCase()}`,
    action: 'Send reminder if payment has not arrived',
    status: 'scheduled',
  })

  timeline(approval, [
    { channel: 'human', direction: 'internal', title: 'Human approved action', body: `${currentUser.name} approved "${approval.action.title}"${edited ? ' with edits' : ''}.` },
    { channel: 'email', direction: 'outbound', title: 'Action executed', body: approval.action.title },
    { channel: 'system', direction: 'internal', title: 'Follow-up scheduled', body: `Payment check on ${followUpDate}.` },
  ])

  db.agentEvents.unshift(
    { id: nextId('ev'), at, kind: 'approval', title: `Approved by ${currentUser.name}`, invoiceNumber: invoice.invoiceNumber, detail: approval.action.title },
    { id: nextId('ev'), at, kind: 'success', title: 'Action executed', invoiceNumber: invoice.invoiceNumber, detail: 'Follow-up scheduled' },
  )
  db.agentEvents.sort((a, b) => b.at.localeCompare(a.at))
  db.auditLog.unshift({ id: nextId('aud'), at, actor: currentUser.name, action: `Approved: ${approval.action.title}${edited ? ' (edited)' : ''}`, target: invoice.invoiceNumber })
  settleRun(invoice.id, `${approval.action.title} — approved and executed`)

  return withInvoice(approval)
}

/** Future: POST /api/approvals/:id/reject */
export async function rejectAction(id: string, reason: string): Promise<ApprovalWithInvoice> {
  await latency(400)
  const approval = findPending(id)
  const invoice = db.invoices.find((i) => i.id === approval.invoiceId)!
  const at = demoNow()

  approval.status = 'rejected'
  approval.decidedAt = at
  approval.decidedBy = currentUser.name
  approval.note = reason

  invoice.aiStatus = 'needs_review'
  invoice.lastAction = { label: 'AI action rejected', at: DEMO_TODAY }
  const investigation = db.investigations.find((i) => i.invoiceId === invoice.id)
  if (investigation) {
    investigation.stage = 'plan_action'
    investigation.currentStep = 'Waiting for manual handling'
  }

  timeline(approval, [{ channel: 'human', direction: 'internal', title: 'Human rejected action', body: reason || 'No reason given.' }])
  db.agentEvents.unshift({ id: nextId('ev'), at, kind: 'approval', title: `Rejected by ${currentUser.name}`, invoiceNumber: invoice.invoiceNumber, detail: reason || approval.action.title })
  db.agentEvents.sort((a, b) => b.at.localeCompare(a.at))
  db.auditLog.unshift({ id: nextId('aud'), at, actor: currentUser.name, action: `Rejected: ${approval.action.title}`, target: invoice.invoiceNumber })
  settleRun(invoice.id, `${approval.action.title} — rejected by reviewer`)

  return withInvoice(approval)
}
