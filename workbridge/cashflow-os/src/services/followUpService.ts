import type { FollowUpRow, FollowUpStatus } from '@/types'
import { NotFoundError, db, latency, nextId } from './mockDb'
import { demoNow } from '@/lib/dates'
import { currentUser } from '@/data/settings'

/** Future: GET /api/follow-ups */
export async function getFollowUps(): Promise<FollowUpRow[]> {
  await latency()
  return db.followUps
    .map((f) => {
      const invoice = db.invoices.find((i) => i.id === f.invoiceId)!
      const customer = db.customers.find((c) => c.id === f.customerId)!
      return { ...f, invoiceNumber: invoice.invoiceNumber, customerName: customer.name, amountDue: invoice.amountDue }
    })
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt))
}

/** Future: PATCH /api/follow-ups/:id */
export async function updateFollowUpStatus(id: string, status: FollowUpStatus): Promise<void> {
  await latency(300)
  const followUp = db.followUps.find((f) => f.id === id)
  if (!followUp) throw new NotFoundError('Follow-up', id)
  followUp.status = status
  const invoice = db.invoices.find((i) => i.id === followUp.invoiceId)!
  db.auditLog.unshift({ id: nextId('aud'), at: demoNow(), actor: currentUser.name, action: `Follow-up marked ${status}`, target: invoice.invoiceNumber })
}
