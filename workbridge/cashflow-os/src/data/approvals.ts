import type { Approval, ApprovalPriority } from '@/types'
import { investigationOutcomes } from './investigations'

function approval(invoiceId: string, shortReason: string, priority: ApprovalPriority, createdAt: string): Approval {
  const outcome = investigationOutcomes[invoiceId]
  if (!outcome) throw new Error(`No investigation outcome for ${invoiceId}`)
  return { id: `apr_${invoiceId.replace('inv-', '')}`, invoiceId, action: outcome.recommendation, shortReason, priority, status: 'pending', createdAt }
}

export const approvals: Approval[] = [
  approval('inv-48291', 'Missing PO detected', 'high', '2026-09-28T10:42:32'),
  approval('inv-48112', 'Active customer dispute', 'high', '2026-09-28T09:59:14'),
  approval('inv-48140', 'Variation charge queried', 'high', '2026-09-28T09:31:30'),
  approval('inv-48177', 'Customer cash-flow pressure', 'normal', '2026-09-28T09:13:20'),
  approval('inv-48240', 'Invoice addressed to wrong entity', 'normal', '2026-09-28T08:47:36'),
  approval('inv-48219', 'Approver on leave until 29 Sep', 'normal', '2026-09-28T08:30:25'),
  approval('inv-48204', 'Reminders bouncing', 'normal', '2026-09-28T08:06:15'),
]
