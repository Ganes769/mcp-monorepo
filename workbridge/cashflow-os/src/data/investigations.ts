import type { AgentTool, Evidence, Investigation, InvestigationStep, LateReason, RecommendedAction } from '@/types'

/** The steps every investigation walks through, in order. The agent service animates these. */
export const INVESTIGATION_STEPS: Array<{ id: string; label: string; tool?: AgentTool; running: string }> = [
  { id: 'invoice', label: 'Retrieved invoice', tool: 'get_invoice', running: 'Loading invoice from Xero' },
  { id: 'customer', label: 'Retrieved customer history', tool: 'get_customer', running: 'Loading customer record' },
  { id: 'payments', label: 'Checked payment history', tool: 'get_payment_history', running: 'Analysing payment behaviour' },
  { id: 'emails', label: 'Searched customer emails', tool: 'search_customer_emails', running: 'Analysing customer communications' },
  { id: 'terms', label: 'Checked payment terms', tool: 'get_contract', running: 'Reading contract and payment terms' },
  { id: 'compare', label: 'Compared previous invoices', tool: 'compare_invoices', running: 'Comparing with previous invoices' },
  { id: 'finding', label: 'Identified likely reason', tool: 'draft_action', running: 'Generating recommendation' },
]

/** Outcome an investigation reaches once all steps have run. */
export interface InvestigationOutcome {
  likelyReason: LateReason
  finding: string
  confidence: number
  evidence: Evidence[]
  recommendation: RecommendedAction
  /** Overrides for specific step labels, e.g. how many emails were searched */
  stepDetails?: Partial<Record<string, string>>
  finalStepLabel?: string
}

export const investigationOutcomes: Record<string, InvestigationOutcome> = {
  'inv-48291': {
    likelyReason: 'missing_po',
    finding: 'Northstar Ltd normally requires a PO number before processing invoices. The current invoice contains no PO reference.',
    confidence: 91,
    finalStepLabel: 'Identified possible missing PO',
    stepDetails: { emails: 'Searched 7 customer emails', terms: '30-day terms · PO mandatory', compare: 'INV-47811 carried PO-7742' },
    evidence: [
      { id: 'ev1', title: 'Contract requires PO', detail: 'Master services agreement §4.2: "All invoices must quote a valid Northstar purchase order number."', source: 'contract', sourceRef: 'MSA-Northstar-2024.pdf' },
      { id: 'ev2', title: 'Previous invoice included PO-7742', detail: 'INV-47811 (Mar 2026) quoted PO-7742 and was paid 9 days after due.', source: 'invoice', sourceRef: 'INV-47811' },
      { id: 'ev3', title: 'Customer requested PO on 12 September', detail: '"Before our AP team can process INV-48291 we need the purchase order number on the invoice."', source: 'email', sourceRef: 'Hannah Price · 12 Sep 2026' },
      { id: 'ev4', title: 'Customer usually pays within 8 days after corrected invoice', detail: 'INV-47689 was reissued with a PO on 14 Nov 2025 and paid on 22 Nov 2025.', source: 'payment_history', sourceRef: 'INV-47689' },
    ],
    recommendation: {
      title: 'Send corrected invoice with PO reference',
      reason: "The invoice is likely blocked by the customer's procurement process.",
      risk: 'low',
      confidence: 91,
      approvalMode: 'approve',
      draft:
        'Hi Hannah,\n\nPlease find attached a corrected copy of INV-48291 which now quotes your purchase order PO-8821. The amount (£11,200.00) is unchanged.\n\nCould you let us know once it has been passed to your AP team?\n\nKind regards,\nAccounts team',
    },
  },
  'inv-48112': {
    likelyReason: 'customer_dispute',
    finding: 'Greenfield Services disputes the final service charge (£1,700 of out-of-hours callouts) and has said it will pay the remainder once this is resolved.',
    confidence: 87,
    finalStepLabel: 'Identified active dispute',
    stepDetails: { emails: 'Searched 4 customer emails' },
    evidence: [
      { id: 'ev1', title: 'Customer disputed callout charge on 3 September', detail: '"We do not agree with the £1,700 out-of-hours callout charge. These visits were not authorised by our site manager."', source: 'email', sourceRef: 'Marcus Webb · 3 Sep 2026' },
      { id: 'ev2', title: 'Contract requires callout authorisation', detail: 'Schedule 2: out-of-hours callouts are billable only with site manager authorisation.', source: 'contract', sourceRef: 'Greenfield-SLA-2023.pdf' },
      { id: 'ev3', title: 'Authorisation found for 1 of 3 callouts', detail: 'Job log shows a signed authorisation for 14 Aug only.', source: 'accounting', sourceRef: 'Job log · Aug 2026' },
      { id: 'ev4', title: 'Customer has 2 previous disputes', detail: 'Both were resolved with a partial credit note.', source: 'payment_history', sourceRef: 'Customer record' },
    ],
    recommendation: {
      title: 'Escalate dispute for review',
      reason: 'The dispute may be partly valid. Contacting the customer before reviewing it risks damaging the relationship.',
      risk: 'high',
      confidence: 87,
      approvalMode: 'review_required',
      draft: 'Escalate to the account manager with the job log and SLA extract. Pause automated reminders until the dispute is resolved.',
    },
  },
  'inv-48140': {
    likelyReason: 'customer_dispute',
    finding: 'Oakridge queried the excavation variation charge, but a signed variation order (VO-114) exists for that work.',
    confidence: 78,
    finalStepLabel: 'Found signed variation order',
    evidence: [
      { id: 'ev1', title: 'Customer said variation was not signed off', detail: '"The variation for extra excavation was never signed off on our side."', source: 'email', sourceRef: 'Gareth Hughes · 12 Sep 2026' },
      { id: 'ev2', title: 'Signed variation order VO-114 found', detail: 'Signed by Oakridge site lead on 18 Aug 2026.', source: 'contract', sourceRef: 'VO-114.pdf' },
    ],
    recommendation: { title: 'Share signed variation order VO-114 with customer', reason: 'The disputed charge appears to be supported by a signed variation.', risk: 'medium', confidence: 78, approvalMode: 'approve', draft: 'Hi Gareth,\n\nAttached is variation order VO-114 signed on 18 August covering the additional excavation. Could you confirm this resolves the query on INV-48140?\n\nKind regards,\nAccounts team' },
  },
  'inv-48177': {
    likelyReason: 'cash_flow_issue',
    finding: 'Pennine Foods mentioned tight cash flow this quarter on a call on 20 September.',
    confidence: 74,
    evidence: [
      { id: 'ev1', title: 'Customer mentioned cash-flow pressure', detail: 'Call note 20 Sep: "Tight quarter, waiting on a large retailer payment."', source: 'email', sourceRef: 'Call log · 20 Sep 2026' },
      { id: 'ev2', title: 'Payments slowing', detail: 'Average delay rose from 9 to 15 days over the last 3 invoices.', source: 'payment_history', sourceRef: 'Payment history' },
    ],
    recommendation: { title: 'Offer 3-instalment payment plan', reason: 'A structured plan is more likely to recover the balance than repeated reminders.', risk: 'medium', confidence: 74, approvalMode: 'approve', draft: 'Hi Laura,\n\nTo help with timing, we can split INV-48177 (£4,920.00) into three monthly payments of £1,640.00 starting 5 October. Let us know if that works.\n\nKind regards,\nAccounts team' },
  },
  'inv-48240': {
    likelyReason: 'incorrect_invoice',
    finding: 'The invoice is addressed to "Marlow Dental Ltd", but the customer trades as Marlow Dental Group, so their AP system may have rejected it.',
    confidence: 88,
    evidence: [
      { id: 'ev1', title: 'Entity name mismatch', detail: 'Invoice addressee differs from the customer record and previous 8 invoices.', source: 'invoice', sourceRef: 'INV-48240' },
    ],
    recommendation: { title: 'Reissue invoice to the correct legal entity', reason: 'Invoices to the wrong entity are commonly rejected by AP systems.', risk: 'low', confidence: 88, approvalMode: 'approve', draft: 'Reissue INV-48240 addressed to Marlow Dental Group and send to accounts@marlowdental.co.uk.' },
  },
  'inv-48219': {
    likelyReason: 'approval_delay',
    finding: "The customer's approver is on leave until 29 September, according to an auto-reply.",
    confidence: 82,
    evidence: [{ id: 'ev1', title: 'Approver out of office', detail: 'Auto-reply from Grace Whitfield: "On leave until 29 September."', source: 'email', sourceRef: 'Auto-reply · 19 Sep 2026' }],
    recommendation: { title: 'Send second reminder with statement on 29 Sep', reason: 'The approver returns on 29 September; a reminder then is more likely to be actioned.', risk: 'low', confidence: 82, approvalMode: 'approve', draft: 'Hi Grace,\n\nWelcome back — a quick reminder that INV-48219 (£1,960.00) is now overdue. A statement is attached for reference.\n\nKind regards,\nAccounts team' },
  },
  'inv-48204': {
    likelyReason: 'contact_issue',
    finding: "Reminders to the accounts mailbox are bouncing. A new finance contact appears in a recent email signature.",
    confidence: 69,
    evidence: [
      { id: 'ev1', title: 'Reminder bounced on 19 September', detail: '550 5.1.1 — mailbox accounts@quaysidestudios.co.uk does not exist.', source: 'email', sourceRef: 'Mail delivery · 19 Sep 2026' },
      { id: 'ev2', title: 'New finance contact in signature', detail: '"Finance: finance@quaysidestudios.co.uk" in Jonah Reid\'s signature (4 Sep).', source: 'email', sourceRef: 'Jonah Reid · 4 Sep 2026' },
    ],
    recommendation: { title: 'Resend invoice to finance@quaysidestudios.co.uk', reason: 'The original invoice may never have reached the customer.', risk: 'low', confidence: 69, approvalMode: 'approve', draft: 'Resend INV-48204 and the 19 Sep reminder to finance@quaysidestudios.co.uk, and update the customer contact.' },
  },
  'inv-48198': {
    likelyReason: 'customer_dispute',
    finding: 'Copperleaf disputes the quantity billed (420 linen sets vs 360 received).',
    confidence: 81,
    evidence: [{ id: 'ev1', title: 'Customer disputed quantity', detail: '"We were billed for 420 sets but only received 360."', source: 'email', sourceRef: 'Isabel Moore · 15 Sep 2026' }],
    recommendation: { title: 'Check delivery notes before issuing a credit note', reason: 'The delivery notes will confirm whether a credit note is due.', risk: 'medium', confidence: 81, approvalMode: 'review_required', draft: 'Request signed delivery notes for w/c 1 Sep from the logistics team.' },
  },
  'inv-48226': {
    likelyReason: 'approval_delay',
    finding: 'Payment was approved by Ashby Legal on 25 September but no remittance has arrived yet.',
    confidence: 76,
    evidence: [{ id: 'ev1', title: 'Customer confirmed approval', detail: '"This has been approved for our next payment run."', source: 'email', sourceRef: 'Daniel Ashby · 25 Sep 2026' }],
    recommendation: { title: 'Request remittance advice', reason: 'Payment appears to be in progress.', risk: 'low', confidence: 76, approvalMode: 'approve', draft: 'Ask for remittance advice for INV-48226.' },
  },
  'inv-48155': {
    likelyReason: 'cash_flow_issue',
    finding: "Harbour & Vale's payments have slowed from 9 to 19 days late over three months, and their last email mentions waiting on a large client payment.",
    confidence: 72,
    evidence: [
      { id: 'ev1', title: 'Payment delays increasing', detail: 'Last three payments: 9, 14 and 19 days late.', source: 'payment_history', sourceRef: 'Payment history' },
      { id: 'ev2', title: 'Customer mentioned delayed receipts', detail: '"We\'re waiting on a large client payment and will settle as soon as it lands."', source: 'email', sourceRef: 'Tom Ellis · 23 Sep 2026' },
    ],
    recommendation: { title: 'Propose a two-part payment plan', reason: 'Splitting the balance reduces the risk of the invoice ageing further.', risk: 'medium', confidence: 72, approvalMode: 'approve', draft: 'Hi Tom,\n\nWe can split INV-48155 (£6,480.00) into two payments on 3 and 17 October. Let us know if that helps.\n\nKind regards,\nAccounts team' },
  },
  'inv-48121': {
    likelyReason: 'contact_issue',
    finding: "The invoice was sent to a former employee's inbox and has not been opened by the accounts team.",
    confidence: 76,
    evidence: [{ id: 'ev1', title: 'Recipient left the company', detail: 'Auto-reply: "Sam no longer works at Thames Valley Print."', source: 'email', sourceRef: 'Auto-reply · 5 Sep 2026' }],
    recommendation: { title: 'Resend invoice to accounts@tvprint.co.uk', reason: 'The accounts team may not have received the invoice.', risk: 'low', confidence: 76, approvalMode: 'approve', draft: 'Resend INV-48121 to accounts@tvprint.co.uk and update the billing contact.' },
  },
  'inv-48233': {
    likelyReason: 'approval_delay',
    finding: "The invoice exceeds Kestrel's £5,000 single-approver limit and needs director sign-off.",
    confidence: 80,
    evidence: [{ id: 'ev1', title: 'Approval limit mentioned by customer', detail: '"Anything over £5k needs sign-off from our director, Paul."', source: 'email', sourceRef: 'Sophie Grant · 16 Sep 2026' }],
    recommendation: { title: 'Send reminder addressed to the approving director', reason: 'The invoice is likely waiting in an internal approval queue.', risk: 'low', confidence: 80, approvalMode: 'approve', draft: 'Hi Sophie and Paul,\n\nA gentle reminder that INV-48233 (£5,400.00) is awaiting sign-off. Happy to answer any questions.\n\nKind regards,\nAccounts team' },
  },
}

function completedSteps(invoiceId: string, outcome: InvestigationOutcome): InvestigationStep[] {
  return INVESTIGATION_STEPS.map((step, i) => ({
    id: step.id,
    label: i === INVESTIGATION_STEPS.length - 1 && outcome.finalStepLabel ? outcome.finalStepLabel : (outcome.stepDetails?.[step.id] ?? step.label),
    status: 'done',
    tool: step.tool,
    detail: invoiceId === 'inv-48291' && step.id === 'invoice' ? 'INV-48291 · £11,200.00 · no PO field' : undefined,
  }))
}

const TOOLS_USED: AgentTool[] = ['get_invoice', 'get_customer', 'get_payment_history', 'search_customer_emails', 'get_contract']

function completed(invoiceId: string, startedAt: string, elapsedSeconds: number, stage: Investigation['stage']): Investigation {
  const outcome = investigationOutcomes[invoiceId]!
  return {
    invoiceId,
    state: 'completed',
    stage,
    startedAt,
    elapsedSeconds,
    currentStep: stage === 'human_approval' ? 'Waiting for human approval' : stage === 'verify_payment' ? 'Watching for payment' : 'Waiting for review',
    steps: completedSteps(invoiceId, outcome),
    toolsUsed: TOOLS_USED,
    likelyReason: outcome.likelyReason,
    finding: outcome.finding,
    confidence: outcome.confidence,
    evidence: outcome.evidence,
    recommendation: outcome.recommendation,
  }
}

function running(invoiceId: string, startedAt: string, doneSteps: number, stage: Investigation['stage']): Investigation {
  return {
    invoiceId,
    state: 'running',
    stage,
    startedAt,
    elapsedSeconds: doneSteps * 14,
    currentStep: INVESTIGATION_STEPS[doneSteps]!.running,
    steps: INVESTIGATION_STEPS.map((s, i) => ({ id: s.id, label: s.label, tool: s.tool, status: i < doneSteps ? 'done' : i === doneSteps ? 'running' : 'pending' })),
    toolsUsed: TOOLS_USED.slice(0, doneSteps),
    likelyReason: 'unknown',
    finding: null,
    confidence: null,
    evidence: [],
    recommendation: null,
  }
}

export const investigations: Investigation[] = [
  completed('inv-48291', '2026-09-28T10:42:11', 21, 'human_approval'),
  completed('inv-48112', '2026-09-28T09:58:40', 34, 'human_approval'),
  completed('inv-48140', '2026-09-28T09:31:02', 28, 'human_approval'),
  completed('inv-48177', '2026-09-28T09:12:55', 25, 'human_approval'),
  completed('inv-48240', '2026-09-28T08:47:19', 17, 'human_approval'),
  completed('inv-48219', '2026-09-28T08:30:06', 19, 'human_approval'),
  completed('inv-48204', '2026-09-28T08:05:44', 31, 'human_approval'),
  completed('inv-48198', '2026-09-27T16:22:10', 26, 'plan_action'),
  completed('inv-48226', '2026-09-26T11:03:37', 18, 'verify_payment'),
  running('inv-48155', '2026-09-28T10:51:02', 3, 'collect_evidence'),
  running('inv-48121', '2026-09-28T10:49:40', 4, 'investigate'),
  running('inv-48233', '2026-09-28T10:47:15', 5, 'investigate'),
  running('inv-48256', '2026-09-28T10:52:30', 1, 'triage'),
]
