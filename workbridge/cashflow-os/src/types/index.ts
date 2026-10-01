/** ISO date `YYYY-MM-DD` */
export type ISODate = string
/** ISO timestamp `YYYY-MM-DDTHH:mm:ss` (local time for the demo) */
export type ISODateTime = string

export type Currency = 'GBP'

export type InvoiceStatus = 'current' | 'due_soon' | 'overdue' | 'disputed' | 'paid'

export type RiskLevel = 'low' | 'medium' | 'high'

export type AIStatus =
  | 'not_started'
  | 'monitoring'
  | 'investigating'
  | 'needs_review'
  | 'awaiting_approval'
  | 'action_executed'
  | 'resolved'

/** AI-identified likely reason for late payment. Always a hypothesis, never a confirmed fact. */
export type LateReason =
  | 'missing_po'
  | 'customer_dispute'
  | 'incorrect_invoice'
  | 'approval_delay'
  | 'cash_flow_issue'
  | 'contact_issue'
  | 'unknown'

export interface InvoiceLine {
  description: string
  quantity: number
  unitPrice: number
}

export interface Invoice {
  id: string
  invoiceNumber: string
  customerId: string
  /** Gross total including VAT */
  amount: number
  subtotal: number
  vat: number
  amountPaid: number
  amountDue: number
  currency: Currency
  invoiceDate: ISODate
  dueDate: ISODate
  paidDate?: ISODate
  paymentTermsDays: number
  /** PO reference printed on the invoice, if any */
  poReference: string | null
  status: InvoiceStatus
  riskLevel: RiskLevel
  aiStatus: AIStatus
  lastAction: { label: string; at: ISODate }
  lines: InvoiceLine[]
}

export interface PostalAddress {
  line1: string
  line2?: string
  city: string
  region?: string
  postcode: string
  country: string
}

/** Mirrors the fields Xero holds on a contact so the record can round-trip via CSV or API. */
export interface Customer {
  id: string
  name: string
  legalName: string
  companyNumber: string
  vatNumber: string
  industry: string
  customerSince: number
  contactName: string
  contactEmail: string
  accountsEmail: string
  phone: string
  website: string
  address: PostalAddress
  paymentTermsDays: number
  /** Customer requires a PO number on every invoice */
  requiresPo: boolean
  /** PO currently on file for open work */
  poOnFile: string | null
  averagePaymentDelayDays: number
  lifetimeInvoiceCount: number
  disputesCount: number
  riskLevel: RiskLevel
  lastPaymentDate: ISODate | null
}

/** A customer joined with live receivables figures derived from invoices. */
export interface CustomerSummary extends Customer {
  outstanding: number
  overdue: number
  openInvoices: number
}

export interface Payment {
  id: string
  customerId: string
  invoiceNumber: string
  amount: number
  dueDate: ISODate
  paidDate: ISODate
  /** Positive = days late, negative = days early */
  daysLate: number
}

export type CommunicationChannel = 'email' | 'system' | 'agent' | 'call' | 'human'
export type CommunicationDirection = 'inbound' | 'outbound' | 'internal'

export interface Communication {
  id: string
  customerId: string
  invoiceId?: string
  at: ISODateTime
  channel: CommunicationChannel
  direction: CommunicationDirection
  title: string
  body?: string
}

export type InvestigationStepStatus = 'done' | 'running' | 'pending'

export interface InvestigationStep {
  id: string
  label: string
  detail?: string
  status: InvestigationStepStatus
  tool?: AgentTool
}

export type EvidenceSource = 'contract' | 'invoice' | 'email' | 'payment_history' | 'accounting'

export interface Evidence {
  id: string
  title: string
  detail: string
  source: EvidenceSource
  sourceRef: string
}

export type AgentTool =
  | 'get_invoice'
  | 'get_customer'
  | 'get_payment_history'
  | 'search_customer_emails'
  | 'get_contract'
  | 'compare_invoices'
  | 'draft_action'

export interface RecommendedAction {
  title: string
  reason: string
  risk: RiskLevel
  confidence: number
  /** Draft message or change the action would apply, editable by a human */
  draft: string
  /** Whether a human can approve this directly or must review first */
  approvalMode: 'approve' | 'review_required'
}

export type InvestigationState = 'queued' | 'running' | 'completed'

export type AgentStage = 'triage' | 'collect_evidence' | 'investigate' | 'plan_action' | 'human_approval' | 'execute' | 'verify_payment'

export interface Investigation {
  invoiceId: string
  state: InvestigationState
  stage: AgentStage
  startedAt: ISODateTime
  elapsedSeconds: number
  currentStep: string
  steps: InvestigationStep[]
  toolsUsed: AgentTool[]
  likelyReason: LateReason
  finding: string | null
  confidence: number | null
  evidence: Evidence[]
  recommendation: RecommendedAction | null
  /** True while the agent is actively executing steps (vs. a stale "running" record) */
  live?: boolean
}

export type AgentEventKind = 'tool_call' | 'decision' | 'action' | 'approval' | 'error' | 'success'

export interface AgentEvent {
  id: string
  at: ISODateTime
  kind: AgentEventKind
  title: string
  invoiceNumber?: string
  detail?: string
  tool?: AgentTool
}

export type AgentRunStatus = 'running' | 'waiting' | 'succeeded' | 'failed'

export interface AgentRun {
  id: string
  invoiceId: string
  startedAt: ISODateTime
  durationSeconds: number
  status: AgentRunStatus
  summary: string
  toolCalls: number
}

/** A single step the agent takes against an external system (email, accounting, etc). */
export interface AgentAction {
  id: string
  runId: string
  type: 'send_email' | 'reissue_invoice' | 'schedule_follow_up' | 'escalate' | 'update_accounting'
  status: 'proposed' | 'approved' | 'executed' | 'rejected'
  description: string
}

export interface AgentDailyStats {
  runsToday: number
  successful: number
  waiting: number
  failed: number
  automatedActions: number
}

export type ApprovalStatus = 'pending' | 'approved' | 'rejected'
export type ApprovalPriority = 'high' | 'normal'

export interface Approval {
  id: string
  invoiceId: string
  action: RecommendedAction
  shortReason: string
  priority: ApprovalPriority
  status: ApprovalStatus
  createdAt: ISODateTime
  decidedAt?: ISODateTime
  decidedBy?: string
  note?: string
}

export type FollowUpStatus = 'scheduled' | 'waiting' | 'completed' | 'cancelled'

export interface FollowUp {
  id: string
  invoiceId: string
  customerId: string
  dueAt: ISODate
  reason: string
  action: string
  status: FollowUpStatus
}

/** Invoice joined with its customer name and derived ageing. */
export interface InvoiceRow extends Invoice {
  customerName: string
  daysOverdue: number
}

export interface InvoiceDetail {
  invoice: InvoiceRow
  customer: Customer
  investigation: Investigation | null
  approval: Approval | null
  timeline: Communication[]
  followUps: FollowUp[]
}

export interface ApprovalWithInvoice extends Approval {
  invoice: InvoiceRow
  /** The AI finding that led to this recommendation */
  finding: string | null
}

export interface CustomerDetail {
  customer: CustomerSummary
  invoices: InvoiceRow[]
  payments: Payment[]
  timeline: Communication[]
}

export interface FollowUpRow extends FollowUp {
  invoiceNumber: string
  customerName: string
  amountDue: number
}

export interface InvestigationRow extends Investigation {
  invoice: InvoiceRow
}

export interface AgentActivity {
  stats: AgentDailyStats
  runs: Array<AgentRun & { invoiceNumber: string; customerName: string }>
  events: AgentEvent[]
}

export type InvoiceFilter =
  | 'all'
  | 'due_soon'
  | 'overdue'
  | 'high_value'
  | 'disputed'
  | 'ai_investigating'
  | 'awaiting_approval'
  | 'resolved'

export interface SearchResult {
  type: 'invoice' | 'customer'
  id: string
  title: string
  subtitle: string
  href: string
}

export interface AuditLogEntry {
  id: string
  at: ISODateTime
  actor: string
  action: string
  target: string
}

export interface Notification {
  id: string
  at: ISODateTime
  title: string
  body: string
  href: string
  unread: boolean
}

export interface CollectionPoint {
  label: string
  collected: number
  overdue: number
}

export type CollectionRange = '7d' | '30d' | '90d' | '6m'

export interface OverviewSummary {
  outstanding: number
  unpaidCount: number
  overdue: number
  overdueCount: number
  recoveredThisMonth: number
  recoveredChangePct: number
  averageDaysOverdue: number
  averageDaysOverdueChange: number
  aiActions: number
  aiActionsAutomatic: number
  pendingApprovals: number
  highPriorityApprovals: number
}

export interface RiskBucket {
  key: 'low' | 'medium' | 'high' | 'disputed'
  label: string
  count: number
  amount: number
}

export interface MonthlyMetric {
  month: string
  recoveryRate: number
  avgCollectionDays: number
  automationRate: number
  humanInterventionRate: number
  recovered: number
}

export interface LateReasonStat {
  reason: LateReason
  count: number
}

export interface Integration {
  id: 'xero' | 'gmail' | 'sage' | 'quickbooks'
  name: string
  description: string
  status: 'demo_connected' | 'not_connected'
  lastSync?: ISODateTime
}

export interface TeamMember {
  id: string
  name: string
  email: string
  role: 'Owner' | 'Finance Manager' | 'Credit Controller' | 'Viewer'
}
