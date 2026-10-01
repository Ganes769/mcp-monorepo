import type { Payment } from '@/types'
import { addDays, daysBetween } from '@/lib/dates'
import { customers } from './customers'

function payment(customerId: string, invoiceNumber: string, amount: number, dueDate: string, paidDate: string): Payment {
  return { id: `pay_${invoiceNumber.toLowerCase()}`, customerId, invoiceNumber, amount, dueDate, paidDate, daysLate: daysBetween(dueDate, paidDate) }
}

/** Northstar's history is hand-written because it drives the primary demo story. */
const northstar: Payment[] = [
  payment('cus_northstar', 'INV-46820', 6_400, '2024-11-15', '2024-11-24'),
  payment('cus_northstar', 'INV-47012', 8_150, '2025-02-14', '2025-02-24'),
  payment('cus_northstar', 'INV-47233', 5_900, '2025-05-09', '2025-05-17'),
  payment('cus_northstar', 'INV-47451', 10_300, '2025-08-15', '2025-08-25'),
  payment('cus_northstar', 'INV-47689', 7_250, '2025-11-14', '2025-11-22'),
  payment('cus_northstar', 'INV-47811', 9_600, '2026-03-13', '2026-03-22'),
  payment('cus_northstar', 'INV-48010', 9_800, '2026-09-08', '2026-09-18'),
]

/** Small deterministic wobble around each customer's average delay. */
const VARIATION = [-2, 1, 0, 3, -1, 1]
const BASE_AMOUNT: Record<string, number> = {
  cus_greenfield: 4_800, cus_bright: 2_700, cus_harbour: 5_900, cus_kestrel: 3_800, cus_marlow: 2_600, cus_oakridge: 7_400,
  cus_pennine: 3_300, cus_quayside: 2_200, cus_riverside: 1_400, cus_thames: 2_100, cus_willow: 1_900, cus_ashby: 3_000, cus_copperleaf: 3_200, cus_meridian: 2_400,
}

const generated: Payment[] = customers
  .filter((c) => c.id !== 'cus_northstar' && c.lastPaymentDate)
  .flatMap((c, ci) =>
    VARIATION.map((wobble, i) => {
      const paidDate = addDays(c.lastPaymentDate!, -i * 31)
      const late = Math.max(-3, c.averagePaymentDelayDays + wobble)
      const amount = Math.round(((BASE_AMOUNT[c.id] ?? 2_500) * (0.85 + ((i * 7 + ci) % 5) * 0.08)) / 10) * 10
      return payment(c.id, `INV-${47_900 - ci * 60 - i * 9}`, amount, addDays(paidDate, -late), paidDate)
    }),
  )

export const payments: Payment[] = [...northstar, ...generated]
