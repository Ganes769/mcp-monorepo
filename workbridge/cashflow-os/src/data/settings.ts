import type { AuditLogEntry, Integration, Notification, TeamMember } from '@/types'

export const company = {
  name: 'Brightline Facilities Ltd',
  companyNumber: '11482907',
  vatNumber: 'GB 312 4478 91',
  address: '14 Albion Street, Leeds LS1 6HX',
  baseCurrency: 'GBP',
  financialYearEnd: '31 March',
}

export const currentUser: TeamMember = { id: 'usr_1', name: 'Ganesh Nawali', email: 'ganesh@brightline.co.uk', role: 'Finance Manager' }

export const team: TeamMember[] = [
  currentUser,
  { id: 'usr_2', name: 'Rachel Owens', email: 'rachel@brightline.co.uk', role: 'Owner' },
  { id: 'usr_3', name: 'Liam Turner', email: 'liam@brightline.co.uk', role: 'Credit Controller' },
  { id: 'usr_4', name: 'Chloe Barnes', email: 'chloe@brightline.co.uk', role: 'Viewer' },
]

export const integrations: Integration[] = [
  { id: 'xero', name: 'Xero', description: 'Invoices, contacts and payments', status: 'demo_connected', lastSync: '2026-09-28T10:40:00' },
  { id: 'gmail', name: 'Gmail', description: 'Customer email history for investigations', status: 'not_connected' },
  { id: 'sage', name: 'Sage', description: 'Alternative accounting source', status: 'not_connected' },
  { id: 'quickbooks', name: 'QuickBooks', description: 'Alternative accounting source', status: 'not_connected' },
]

export const aiSettings = {
  autoSendLowRiskReminders: true,
  requireApprovalForReissue: true,
  requireApprovalAbove: 5_000,
  minimumConfidence: 70,
  pauseRemindersOnDispute: true,
}

export const notificationSettings = {
  approvalRequests: true,
  highRiskFindings: true,
  paymentsReceived: true,
  dailyDigest: false,
}

export const auditLog: AuditLogEntry[] = [
  { id: 'aud_05', at: '2026-09-28T10:20:57', actor: 'AI Agent', action: 'Sent friendly reminder (auto-policy)', target: 'INV-48284' },
  { id: 'aud_04', at: '2026-09-28T08:58:29', actor: 'AI Agent', action: 'Sent friendly reminder (auto-policy)', target: 'INV-48270' },
  { id: 'aud_03', at: '2026-09-27T16:40:12', actor: 'Liam Turner', action: 'Approved: Request remittance advice', target: 'INV-48226' },
  { id: 'aud_02', at: '2026-09-26T09:12:00', actor: 'Rachel Owens', action: 'Updated approval policy: require approval above £5,000', target: 'Settings' },
  { id: 'aud_01', at: '2026-09-25T14:03:44', actor: 'Ganesh Nawali', action: 'Paused reminders for disputed invoice', target: 'INV-48112' },
]

export const notifications: Notification[] = [
  { id: 'nt_1', at: '2026-09-28T10:42:32', title: 'Approval needed · INV-48291', body: 'Send corrected invoice with PO reference to Northstar Ltd.', href: '/app/approvals', unread: true },
  { id: 'nt_2', at: '2026-09-28T09:59:14', title: 'High-risk dispute · INV-48112', body: 'Greenfield Services disputes the final service charge.', href: '/app/invoices/inv-48112', unread: true },
  { id: 'nt_3', at: '2026-09-28T09:44:15', title: 'Agent run failed · INV-48259', body: 'Email search timed out after 3 retries.', href: '/app/agent-activity', unread: true },
  { id: 'nt_4', at: '2026-09-26T15:20:00', title: 'Payment received · INV-48090', body: 'Marlow Dental Group paid £5,800.', href: '/app/invoices/inv-48090', unread: false },
]
