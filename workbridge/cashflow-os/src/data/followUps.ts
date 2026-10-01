import type { FollowUp } from '@/types'

export const followUps: FollowUp[] = [
  { id: 'fu_01', invoiceId: 'inv-48226', customerId: 'cus_ashby', dueAt: '2026-09-29', reason: 'Customer confirmed payment approved on 25 Sep', action: 'Chase remittance advice if payment has not arrived', status: 'scheduled' },
  { id: 'fu_02', invoiceId: 'inv-48155', customerId: 'cus_harbour', dueAt: '2026-09-30', reason: 'Customer waiting on a large client payment', action: 'Call accounts if no remittance by end of day', status: 'waiting' },
  { id: 'fu_03', invoiceId: 'inv-48302', customerId: 'cus_bright', dueAt: '2026-10-01', reason: 'Invoice due 30 Sep', action: 'Send due-date reminder if unpaid', status: 'scheduled' },
  { id: 'fu_04', invoiceId: 'inv-48284', customerId: 'cus_copperleaf', dueAt: '2026-10-01', reason: 'Friendly reminder sent 27 Sep', action: 'Send second reminder with statement', status: 'scheduled' },
  { id: 'fu_05', invoiceId: 'inv-48270', customerId: 'cus_ashby', dueAt: '2026-10-02', reason: 'Friendly reminder sent 26 Sep', action: 'Send second reminder if unpaid', status: 'scheduled' },
  { id: 'fu_06', invoiceId: 'inv-48177', customerId: 'cus_pennine', dueAt: '2026-09-29', reason: 'Payment plan waiting for approval', action: 'Send payment plan once approved', status: 'waiting' },
  { id: 'fu_07', invoiceId: 'inv-48112', customerId: 'cus_greenfield', dueAt: '2026-09-24', reason: 'Automated reminders paused — active dispute', action: 'Second reminder', status: 'cancelled' },
  { id: 'fu_08', invoiceId: 'inv-48090', customerId: 'cus_marlow', dueAt: '2026-09-26', reason: 'Waiting for payment after reminder', action: 'Payment received — closed', status: 'completed' },
  { id: 'fu_09', invoiceId: 'inv-48071', customerId: 'cus_kestrel', dueAt: '2026-09-11', reason: 'Waiting for payment after reminder', action: 'Payment received — closed', status: 'completed' },
]
