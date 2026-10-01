import type { AIStatus, ISODate, Invoice, InvoiceLine, InvoiceStatus, RiskLevel } from '@/types'
import { addDays, daysBetween } from '@/lib/dates'
import { customers } from './customers'

interface Seed {
  number: string
  customerId: string
  amount: number
  due: ISODate
  status: InvoiceStatus
  risk: RiskLevel
  ai: AIStatus
  last: [label: string, at: ISODate]
  invoiceDate?: ISODate
  paid?: ISODate
  /** `undefined` = use the customer's PO on file (if they require one); `null` = missing */
  po?: string | null
  lines?: InvoiceLine[]
}

const DEFAULT_LINE: Record<string, string> = {
  cus_northstar: 'Warehouse racking maintenance',
  cus_greenfield: 'Facilities support services',
  cus_bright: 'Office furniture and supplies',
  cus_harbour: 'Fleet telematics subscription',
  cus_kestrel: 'CNC machining services',
  cus_marlow: 'Practice management support',
  cus_oakridge: 'Site surveying and groundworks',
  cus_pennine: 'Cold-chain packaging',
  cus_quayside: 'Brand photography retainer',
  cus_riverside: 'Clinical equipment servicing',
  cus_thames: 'Commercial print run',
  cus_willow: 'Furniture sourcing and fit-out',
  cus_ashby: 'Document management services',
  cus_copperleaf: 'Linen and laundry service',
  cus_meridian: 'Electrical installation and testing',
}

const round2 = (n: number) => Math.round(n * 100) / 100

function build(seed: Seed): Invoice {
  const customer = customers.find((c) => c.id === seed.customerId)
  if (!customer) throw new Error(`Unknown customer ${seed.customerId} for ${seed.number}`)
  const subtotal = round2(seed.amount / 1.2)
  const invoiceDate = seed.invoiceDate ?? addDays(seed.due, -customer.paymentTermsDays)
  const amountPaid = seed.paid ? seed.amount : 0
  return {
    id: seed.number.toLowerCase(),
    invoiceNumber: seed.number,
    customerId: seed.customerId,
    amount: seed.amount,
    subtotal,
    vat: round2(seed.amount - subtotal),
    amountPaid,
    amountDue: seed.amount - amountPaid,
    currency: 'GBP',
    invoiceDate,
    dueDate: seed.due,
    paidDate: seed.paid,
    paymentTermsDays: daysBetween(invoiceDate, seed.due),
    poReference: seed.po === undefined ? (customer.requiresPo ? customer.poOnFile : null) : seed.po,
    status: seed.status,
    riskLevel: seed.risk,
    aiStatus: seed.ai,
    lastAction: { label: seed.last[0], at: seed.last[1] },
    lines: seed.lines ?? [{ description: DEFAULT_LINE[seed.customerId] ?? 'Professional services', quantity: 1, unitPrice: subtotal }],
  }
}

/*
 * 42 unpaid invoices (27 overdue, 5 due within 7 days, 10 current) totalling £128,450,
 * plus paid invoices used for "recovered this month" and payment history.
 */
const seeds: Seed[] = [
  // ── Overdue: disputed ────────────────────────────────────────────────
  {
    number: 'INV-48291', customerId: 'cus_northstar', amount: 11_200, invoiceDate: '2026-09-01', due: '2026-09-10',
    status: 'overdue', risk: 'low', ai: 'awaiting_approval', last: ['Corrected invoice prepared', '2026-09-21'], po: null,
    lines: [
      { description: 'Industrial shelving installation — Unit 4, Leeds', quantity: 1, unitPrice: 7_500 },
      { description: 'Load-bearing safety inspection and certification', quantity: 1, unitPrice: 1_833.33 },
    ],
  },
  { number: 'INV-48112', customerId: 'cus_greenfield', amount: 7_850, due: '2026-08-28', status: 'disputed', risk: 'high', ai: 'needs_review', last: ['Dispute raised by customer', '2026-09-03'],
    lines: [
      { description: 'Quarterly facilities support — Q3', quantity: 1, unitPrice: 5_125 },
      { description: 'Final service charge — out-of-hours callouts', quantity: 1, unitPrice: 1_416.67 },
    ] },
  { number: 'INV-48140', customerId: 'cus_oakridge', amount: 6_200, due: '2026-09-05', status: 'disputed', risk: 'high', ai: 'awaiting_approval', last: ['Variation charge queried', '2026-09-12'] },
  { number: 'INV-48198', customerId: 'cus_copperleaf', amount: 2_340, due: '2026-09-08', status: 'disputed', risk: 'high', ai: 'needs_review', last: ['Customer disputed quantity', '2026-09-15'] },
  // ── Overdue: high risk ───────────────────────────────────────────────
  { number: 'INV-48155', customerId: 'cus_harbour', amount: 6_480, due: '2026-09-08', status: 'overdue', risk: 'high', ai: 'investigating', last: ['Second reminder sent', '2026-09-22'] },
  { number: 'INV-48177', customerId: 'cus_pennine', amount: 4_920, due: '2026-09-09', status: 'overdue', risk: 'high', ai: 'awaiting_approval', last: ['Payment plan drafted', '2026-09-25'] },
  { number: 'INV-48204', customerId: 'cus_quayside', amount: 3_150, due: '2026-09-09', status: 'overdue', risk: 'high', ai: 'awaiting_approval', last: ['Reminder bounced', '2026-09-19'] },
  { number: 'INV-48121', customerId: 'cus_thames', amount: 2_760, due: '2026-09-04', status: 'overdue', risk: 'high', ai: 'investigating', last: ['Final reminder sent', '2026-09-24'] },
  // ── Overdue: medium risk ─────────────────────────────────────────────
  { number: 'INV-48233', customerId: 'cus_kestrel', amount: 5_400, due: '2026-09-14', status: 'overdue', risk: 'medium', ai: 'investigating', last: ['Reminder sent', '2026-09-21'] },
  { number: 'INV-48240', customerId: 'cus_marlow', amount: 2_180, due: '2026-09-15', status: 'overdue', risk: 'medium', ai: 'awaiting_approval', last: ['Entity mismatch detected', '2026-09-23'] },
  { number: 'INV-48219', customerId: 'cus_willow', amount: 1_960, due: '2026-09-12', status: 'overdue', risk: 'medium', ai: 'awaiting_approval', last: ['Reminder sent', '2026-09-19'] },
  { number: 'INV-48226', customerId: 'cus_ashby', amount: 3_480, due: '2026-09-13', status: 'overdue', risk: 'medium', ai: 'action_executed', last: ['Remittance requested', '2026-09-26'] },
  { number: 'INV-48248', customerId: 'cus_riverside', amount: 1_240, due: '2026-09-17', status: 'overdue', risk: 'medium', ai: 'monitoring', last: ['Reminder sent', '2026-09-24'] },
  { number: 'INV-48256', customerId: 'cus_harbour', amount: 2_050, due: '2026-09-18', status: 'overdue', risk: 'medium', ai: 'investigating', last: ['Reminder sent', '2026-09-25'] },
  { number: 'INV-48259', customerId: 'cus_pennine', amount: 1_730, due: '2026-09-19', status: 'overdue', risk: 'medium', ai: 'monitoring', last: ['Reminder sent', '2026-09-26'] },
  // ── Overdue: low risk ────────────────────────────────────────────────
  { number: 'INV-48265', customerId: 'cus_kestrel', amount: 1_420, due: '2026-09-20', status: 'overdue', risk: 'low', ai: 'monitoring', last: ['Reminder scheduled', '2026-09-27'] },
  { number: 'INV-48270', customerId: 'cus_ashby', amount: 980, due: '2026-09-21', status: 'overdue', risk: 'low', ai: 'action_executed', last: ['Friendly reminder sent', '2026-09-26'] },
  { number: 'INV-48272', customerId: 'cus_quayside', amount: 860, due: '2026-09-22', status: 'overdue', risk: 'low', ai: 'monitoring', last: ['Reminder scheduled', '2026-09-27'] },
  { number: 'INV-48274', customerId: 'cus_willow', amount: 1_150, due: '2026-09-22', status: 'overdue', risk: 'low', ai: 'monitoring', last: ['Reminder scheduled', '2026-09-27'] },
  { number: 'INV-48279', customerId: 'cus_marlow', amount: 740, due: '2026-09-23', status: 'overdue', risk: 'low', ai: 'monitoring', last: ['Reminder scheduled', '2026-09-28'] },
  { number: 'INV-48281', customerId: 'cus_riverside', amount: 620, due: '2026-09-24', status: 'overdue', risk: 'low', ai: 'monitoring', last: ['Reminder scheduled', '2026-09-28'] },
  { number: 'INV-48284', customerId: 'cus_copperleaf', amount: 1_380, due: '2026-09-24', status: 'overdue', risk: 'low', ai: 'action_executed', last: ['Friendly reminder sent', '2026-09-27'] },
  { number: 'INV-48286', customerId: 'cus_thames', amount: 540, due: '2026-09-25', status: 'overdue', risk: 'low', ai: 'monitoring', last: ['Invoice due', '2026-09-25'] },
  { number: 'INV-48288', customerId: 'cus_oakridge', amount: 1_860, due: '2026-09-25', status: 'overdue', risk: 'low', ai: 'monitoring', last: ['Invoice due', '2026-09-25'] },
  { number: 'INV-48289', customerId: 'cus_pennine', amount: 700, due: '2026-09-26', status: 'overdue', risk: 'low', ai: 'monitoring', last: ['Invoice due', '2026-09-26'] },
  { number: 'INV-48290', customerId: 'cus_kestrel', amount: 1_310, due: '2026-09-26', status: 'overdue', risk: 'low', ai: 'monitoring', last: ['Invoice due', '2026-09-26'] },
  { number: 'INV-48293', customerId: 'cus_harbour', amount: 320, due: '2026-09-27', status: 'overdue', risk: 'low', ai: 'monitoring', last: ['Invoice due', '2026-09-27'] },
  // ── Due within 7 days ────────────────────────────────────────────────
  { number: 'INV-48302', customerId: 'cus_bright', amount: 3_200, due: '2026-09-30', status: 'due_soon', risk: 'low', ai: 'monitoring', last: ['Pre-due reminder sent', '2026-09-25'] },
  { number: 'INV-48305', customerId: 'cus_kestrel', amount: 4_600, due: '2026-10-01', status: 'due_soon', risk: 'low', ai: 'monitoring', last: ['Invoice sent', '2026-09-01'] },
  { number: 'INV-48308', customerId: 'cus_marlow', amount: 2_900, due: '2026-10-02', status: 'due_soon', risk: 'low', ai: 'monitoring', last: ['Invoice sent', '2026-09-18'] },
  { number: 'INV-48311', customerId: 'cus_ashby', amount: 3_750, due: '2026-10-03', status: 'due_soon', risk: 'low', ai: 'monitoring', last: ['Invoice sent', '2026-09-03'] },
  { number: 'INV-48314', customerId: 'cus_willow', amount: 1_850, due: '2026-10-04', status: 'due_soon', risk: 'low', ai: 'monitoring', last: ['Invoice sent', '2026-09-04'] },
  // ── Current (not yet due) ────────────────────────────────────────────
  { number: 'INV-48318', customerId: 'cus_oakridge', amount: 8_400, due: '2026-10-10', status: 'current', risk: 'low', ai: 'not_started', last: ['Invoice sent', '2026-09-10'] },
  { number: 'INV-48320', customerId: 'cus_harbour', amount: 5_200, due: '2026-10-12', status: 'current', risk: 'low', ai: 'not_started', last: ['Invoice sent', '2026-09-12'] },
  { number: 'INV-48323', customerId: 'cus_pennine', amount: 3_100, due: '2026-10-14', status: 'current', risk: 'low', ai: 'not_started', last: ['Invoice sent', '2026-09-14'] },
  { number: 'INV-48325', customerId: 'cus_quayside', amount: 2_450, due: '2026-10-15', status: 'current', risk: 'low', ai: 'not_started', last: ['Invoice sent', '2026-09-15'] },
  { number: 'INV-48327', customerId: 'cus_copperleaf', amount: 4_300, due: '2026-10-17', status: 'current', risk: 'low', ai: 'not_started', last: ['Invoice sent', '2026-09-17'] },
  { number: 'INV-48329', customerId: 'cus_thames', amount: 1_980, due: '2026-10-19', status: 'current', risk: 'low', ai: 'not_started', last: ['Invoice sent', '2026-09-19'] },
  { number: 'INV-48331', customerId: 'cus_riverside', amount: 1_600, due: '2026-10-20', status: 'current', risk: 'low', ai: 'not_started', last: ['Invoice sent', '2026-09-22'], invoiceDate: '2026-09-22' },
  { number: 'INV-48333', customerId: 'cus_kestrel', amount: 3_900, due: '2026-10-22', status: 'current', risk: 'low', ai: 'not_started', last: ['Invoice sent', '2026-09-22'] },
  { number: 'INV-48335', customerId: 'cus_ashby', amount: 2_700, due: '2026-10-24', status: 'current', risk: 'low', ai: 'not_started', last: ['Invoice sent', '2026-09-24'] },
  { number: 'INV-48337', customerId: 'cus_marlow', amount: 3_700, due: '2026-10-26', status: 'current', risk: 'low', ai: 'not_started', last: ['Invoice sent', '2026-09-26'], invoiceDate: '2026-09-26' },
  { number: 'INV-48340', customerId: 'cus_meridian', amount: 2_880, due: '2026-10-12', status: 'current', risk: 'low', ai: 'not_started', last: ['Invoice sent', '2026-09-12'], po: 'ME-4402' },
  // ── Paid this month (recovered after going overdue): £32,400 ─────────
  { number: 'INV-48010', customerId: 'cus_northstar', amount: 9_800, due: '2026-09-08', paid: '2026-09-18', status: 'paid', risk: 'low', ai: 'resolved', last: ['Payment received', '2026-09-18'], po: 'PO-7742' },
  { number: 'INV-48044', customerId: 'cus_bright', amount: 2_600, due: '2026-09-22', paid: '2026-09-24', status: 'paid', risk: 'low', ai: 'resolved', last: ['Payment received', '2026-09-24'] },
  { number: 'INV-48062', customerId: 'cus_harbour', amount: 6_900, due: '2026-09-01', paid: '2026-09-16', status: 'paid', risk: 'low', ai: 'resolved', last: ['Payment received', '2026-09-16'] },
  { number: 'INV-48071', customerId: 'cus_kestrel', amount: 4_200, due: '2026-09-04', paid: '2026-09-11', status: 'paid', risk: 'low', ai: 'resolved', last: ['Payment received', '2026-09-11'] },
  { number: 'INV-48083', customerId: 'cus_copperleaf', amount: 3_100, due: '2026-09-12', paid: '2026-09-22', status: 'paid', risk: 'low', ai: 'resolved', last: ['Payment received', '2026-09-22'] },
  { number: 'INV-48090', customerId: 'cus_marlow', amount: 5_800, due: '2026-09-19', paid: '2026-09-26', status: 'paid', risk: 'low', ai: 'resolved', last: ['Payment received', '2026-09-26'] },
  // ── Paid earlier ─────────────────────────────────────────────────────
  { number: 'INV-47980', customerId: 'cus_greenfield', amount: 4_100, due: '2026-08-06', paid: '2026-08-29', status: 'paid', risk: 'low', ai: 'resolved', last: ['Payment received', '2026-08-29'] },
  { number: 'INV-47955', customerId: 'cus_ashby', amount: 2_950, due: '2026-08-10', paid: '2026-08-15', status: 'paid', risk: 'low', ai: 'resolved', last: ['Payment received', '2026-08-15'] },
]

export const invoices: Invoice[] = seeds.map(build)
