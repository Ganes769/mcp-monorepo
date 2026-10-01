import type { AgentActivity, AgentEventKind, AgentTool, Investigation, InvestigationRow, RecommendedAction } from '@/types'
import { daysOverdue, demoNow } from '@/lib/dates'
import { formatMoney } from '@/lib/format'
import { INVESTIGATION_STEPS, investigationOutcomes, type InvestigationOutcome } from '@/data/investigations'
import { NotFoundError, db, latency, nextId } from './mockDb'
import { toRow } from './invoiceService'

/**
 * UI-only simulation of the collections agent. It is NOT an LLM: it replays a fixed sequence
 * of tool calls with delays and then applies a pre-written (or rule-based) outcome.
 * In production this becomes POST /api/agent/investigations + polling/streaming from the
 * LangGraph agent.
 */
const STEP_MS = 1_300
const active = new Map<string, number[]>()

function stageForStep(stepIndex: number): Investigation['stage'] {
  if (stepIndex <= 0) return 'triage'
  if (stepIndex <= 3) return 'collect_evidence'
  if (stepIndex <= 5) return 'investigate'
  return 'plan_action'
}

/** Rule-based outcome for invoices without a pre-written investigation. */
function genericOutcome(invoiceId: string): InvestigationOutcome {
  const invoice = db.invoices.find((i) => i.id === invoiceId)!
  const customer = db.customers.find((c) => c.id === invoice.customerId)!
  const late = daysOverdue(invoice.dueDate)
  const withinPattern = late <= customer.averagePaymentDelayDays + 3
  const recommendation: RecommendedAction = withinPattern
    ? {
        title: 'Send a friendly payment reminder',
        reason: `${customer.name} usually pays about ${customer.averagePaymentDelayDays} days late; this invoice is within that pattern.`,
        risk: 'low',
        confidence: 64,
        approvalMode: 'approve',
        draft: `Hi ${customer.contactName.split(' ')[0]},\n\nA quick reminder that ${invoice.invoiceNumber} (${formatMoney(invoice.amountDue, { precise: true })}) is now due. Please let us know if you need anything from us.\n\nKind regards,\nAccounts team`,
      }
    : {
        title: `Call ${customer.contactName} about ${invoice.invoiceNumber}`,
        reason: `The invoice is ${late} days overdue, longer than ${customer.name}'s usual ${customer.averagePaymentDelayDays}-day delay, and no reason was found in the records.`,
        risk: 'medium',
        confidence: 52,
        approvalMode: 'approve',
        draft: `Call ${customer.contactName} to confirm ${invoice.invoiceNumber} has been received and ask for an expected payment date.`,
      }
  return {
    likelyReason: withinPattern ? 'approval_delay' : 'unknown',
    finding: withinPattern
      ? `No blocking issue was found. ${customer.name} typically pays ${customer.averagePaymentDelayDays} days late and this invoice is ${late} days overdue, which fits that pattern.`
      : `No dispute, missing information or contact problem was found. The invoice is ${late} days overdue, beyond ${customer.name}'s usual pattern, so the reason is unclear.`,
    confidence: recommendation.confidence,
    evidence: [
      { id: 'ev1', title: `Average payment delay: ${customer.averagePaymentDelayDays} days`, detail: `Based on ${customer.lifetimeInvoiceCount} previous invoices.`, source: 'payment_history', sourceRef: 'Payment history' },
      { id: 'ev2', title: 'No dispute or query found in communications', detail: 'No inbound emails mention this invoice.', source: 'email', sourceRef: 'Email search' },
    ],
    recommendation,
  }
}

function event(invoiceNumber: string, kind: AgentEventKind, title: string, extra: { detail?: string; tool?: AgentTool } = {}) {
  db.agentEvents.unshift({ id: nextId('ev'), at: demoNow(), kind, title, invoiceNumber, ...extra })
}

function complete(investigation: Investigation, runId: string) {
  const invoice = db.invoices.find((i) => i.id === investigation.invoiceId)!
  const outcome = investigationOutcomes[invoice.id] ?? genericOutcome(invoice.id)
  const last = INVESTIGATION_STEPS.length - 1
  investigation.steps = INVESTIGATION_STEPS.map((s, i) => ({
    id: s.id,
    tool: s.tool,
    status: 'done',
    label: i === last && outcome.finalStepLabel ? outcome.finalStepLabel : (outcome.stepDetails?.[s.id] ?? s.label),
  }))
  Object.assign(investigation, {
    state: 'completed',
    stage: 'human_approval',
    currentStep: 'Waiting for human approval',
    likelyReason: outcome.likelyReason,
    finding: outcome.finding,
    confidence: outcome.confidence,
    evidence: outcome.evidence,
    recommendation: outcome.recommendation,
  } satisfies Partial<Investigation>)

  const reviewOnly = outcome.recommendation.approvalMode === 'review_required'
  invoice.aiStatus = reviewOnly ? 'needs_review' : 'awaiting_approval'
  invoice.lastAction = { label: 'AI recommendation ready', at: investigation.startedAt.slice(0, 10) }

  if (!db.approvals.some((a) => a.invoiceId === invoice.id && a.status === 'pending')) {
    db.approvals.unshift({
      id: nextId('apr'),
      invoiceId: invoice.id,
      action: outcome.recommendation,
      shortReason: outcome.recommendation.reason.split('.')[0]!,
      priority: invoice.amountDue >= 5_000 || outcome.recommendation.risk === 'high' ? 'high' : 'normal',
      status: 'pending',
      createdAt: demoNow(),
    })
  }

  event(invoice.invoiceNumber, 'decision', 'Generated recommended action', { detail: `${outcome.recommendation.title} · ${outcome.confidence}% confidence`, tool: 'draft_action' })
  event(invoice.invoiceNumber, 'approval', reviewOnly ? 'Review requested' : 'Waiting for human approval')

  const run = db.agentRuns.find((r) => r.id === runId)
  if (run) {
    run.status = 'waiting'
    run.durationSeconds = investigation.elapsedSeconds
    run.summary = `${outcome.recommendation.title} — waiting for ${reviewOnly ? 'review' : 'approval'}`
  }
  db.agentStats.waiting += 1
  active.delete(invoice.id)
}

/** Future: POST /api/agent/investigations { invoiceId } */
export async function startInvestigation(invoiceId: string): Promise<Investigation> {
  await latency(150)
  const invoice = db.invoices.find((i) => i.id === invoiceId)
  if (!invoice) throw new NotFoundError('Invoice', invoiceId)
  if (active.has(invoiceId)) return db.investigations.find((i) => i.invoiceId === invoiceId)!

  const startedAt = demoNow()
  const investigation: Investigation = {
    invoiceId,
    state: 'running',
    stage: 'triage',
    startedAt,
    elapsedSeconds: 0,
    currentStep: INVESTIGATION_STEPS[0]!.running,
    steps: INVESTIGATION_STEPS.map((s, i) => ({ id: s.id, label: s.label, tool: s.tool, status: i === 0 ? 'running' : 'pending' })),
    toolsUsed: [],
    likelyReason: 'unknown',
    finding: null,
    confidence: null,
    evidence: [],
    recommendation: null,
  }
  db.investigations = [investigation, ...db.investigations.filter((i) => i.invoiceId !== invoiceId)]
  invoice.aiStatus = 'investigating'

  const runId = nextId('run')
  db.agentRuns.unshift({ id: runId, invoiceId, startedAt, durationSeconds: 0, status: 'running', summary: 'Investigation in progress', toolCalls: 0 })
  db.agentStats.runsToday += 1
  event(invoice.invoiceNumber, 'action', 'Agent started investigation')

  const timers: number[] = []
  const clock = window.setInterval(() => {
    investigation.elapsedSeconds += 1
  }, 1_000)
  timers.push(clock)

  INVESTIGATION_STEPS.forEach((step, index) => {
    timers.push(
      window.setTimeout(() => {
        investigation.steps[index]!.status = 'done'
        if (step.tool && !investigation.toolsUsed.includes(step.tool)) investigation.toolsUsed.push(step.tool)
        const run = db.agentRuns.find((r) => r.id === runId)
        if (run) run.toolCalls += 1
        event(invoice.invoiceNumber, 'tool_call', step.label, { tool: step.tool })

        const next = INVESTIGATION_STEPS[index + 1]
        if (next) {
          investigation.steps[index + 1]!.status = 'running'
          investigation.currentStep = next.running
          investigation.stage = stageForStep(index + 1)
        } else {
          window.clearInterval(clock)
          complete(investigation, runId)
        }
      }, STEP_MS * (index + 1)),
    )
  })
  active.set(invoiceId, timers)
  return investigation
}

/** Future: GET /api/agent/investigations/:invoiceId */
export async function getInvestigation(invoiceId: string): Promise<Investigation | null> {
  await latency(60)
  const found = db.investigations.find((i) => i.invoiceId === invoiceId)
  return found ? { ...structuredClone(found), live: active.has(invoiceId) } : null
}

/** Future: GET /api/agent/investigations */
export async function getInvestigations(): Promise<InvestigationRow[]> {
  await latency()
  return db.investigations
    .map((investigation) => {
      const invoice = db.invoices.find((i) => i.id === investigation.invoiceId)!
      return { ...structuredClone(investigation), invoice: toRow(invoice) }
    })
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
}

/** Future: GET /api/agent/activity */
export async function getAgentActivity(): Promise<AgentActivity> {
  await latency()
  return {
    stats: { ...db.agentStats },
    runs: db.agentRuns.map((run) => {
      const invoice = toRow(db.invoices.find((i) => i.id === run.invoiceId)!)
      return { ...run, invoiceNumber: invoice.invoiceNumber, customerName: invoice.customerName }
    }),
    events: [...db.agentEvents],
  }
}
