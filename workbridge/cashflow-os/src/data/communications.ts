import type { Communication } from '@/types'

export const communications: Communication[] = [
  // ── Northstar Ltd (primary demo story) ─────────────────────────────
  { id: 'com_ns_01', customerId: 'cus_northstar', at: '2025-11-03T09:14:00', channel: 'email', direction: 'inbound', title: 'Customer asked for PO on INV-47689', body: 'Our AP system rejects invoices without a PO number. Please reissue INV-47689 with PO-6610.' },
  { id: 'com_ns_02', customerId: 'cus_northstar', at: '2025-11-14T11:02:00', channel: 'email', direction: 'outbound', title: 'Corrected invoice INV-47689 sent with PO-6610' },
  { id: 'com_ns_03', customerId: 'cus_northstar', at: '2025-11-22T15:40:00', channel: 'system', direction: 'internal', title: 'Payment received for INV-47689', body: 'Paid 8 days after the corrected invoice was sent.' },
  { id: 'com_ns_04', customerId: 'cus_northstar', at: '2026-03-10T10:05:00', channel: 'email', direction: 'outbound', title: 'Invoice INV-47811 sent with PO-7742' },
  { id: 'com_ns_05', customerId: 'cus_northstar', at: '2026-03-11T08:47:00', channel: 'email', direction: 'inbound', title: 'Customer confirmed receipt of INV-47811' },
  { id: 'com_ns_06', customerId: 'cus_northstar', at: '2026-08-12T14:20:00', channel: 'email', direction: 'inbound', title: 'Customer issued PO-8821 for Unit 4 installation', body: 'Please quote PO-8821 on all invoices for the Unit 4 shelving work.' },
  { id: 'com_ns_07', customerId: 'cus_northstar', invoiceId: 'inv-48291', at: '2026-09-01T09:00:00', channel: 'system', direction: 'outbound', title: 'Invoice INV-48291 issued' },
  { id: 'com_ns_08', customerId: 'cus_northstar', invoiceId: 'inv-48291', at: '2026-09-10T00:00:00', channel: 'system', direction: 'internal', title: 'Invoice became due' },
  {
    id: 'com_ns_09', customerId: 'cus_northstar', invoiceId: 'inv-48291', at: '2026-09-12T10:31:00', channel: 'email', direction: 'inbound',
    title: 'Customer emailed asking for PO reference',
    body: 'Hi, before our AP team can process INV-48291 we need the purchase order number on the invoice. Could you reissue it with the PO? Thanks, Hannah',
  },
  { id: 'com_ns_10', customerId: 'cus_northstar', invoiceId: 'inv-48291', at: '2026-09-18T09:00:00', channel: 'email', direction: 'outbound', title: 'Reminder sent', body: 'Automated payment reminder for INV-48291 (8 days overdue).' },
  { id: 'com_ns_11', customerId: 'cus_northstar', invoiceId: 'inv-48291', at: '2026-09-20T10:42:27', channel: 'agent', direction: 'internal', title: 'AI detected possible PO issue', body: 'Invoice has no PO reference; customer requires one and asked for it on 12 Sep.' },
  { id: 'com_ns_12', customerId: 'cus_northstar', invoiceId: 'inv-48291', at: '2026-09-21T08:15:00', channel: 'agent', direction: 'internal', title: 'Corrected invoice prepared', body: 'Draft reissue of INV-48291 with PO-8821, awaiting human approval.' },

  // ── Greenfield Services Ltd ─────────────────────────────────────────
  { id: 'com_gf_01', customerId: 'cus_greenfield', invoiceId: 'inv-48112', at: '2026-07-29T09:00:00', channel: 'system', direction: 'outbound', title: 'Invoice INV-48112 issued' },
  { id: 'com_gf_02', customerId: 'cus_greenfield', invoiceId: 'inv-48112', at: '2026-08-28T00:00:00', channel: 'system', direction: 'internal', title: 'Invoice became due' },
  {
    id: 'com_gf_03', customerId: 'cus_greenfield', invoiceId: 'inv-48112', at: '2026-09-03T16:12:00', channel: 'email', direction: 'inbound',
    title: 'Customer disputed the final service charge',
    body: 'We do not agree with the £1,700 out-of-hours callout charge. These visits were not authorised by our site manager. We will pay the remainder once this is resolved.',
  },
  { id: 'com_gf_04', customerId: 'cus_greenfield', invoiceId: 'inv-48112', at: '2026-09-10T09:00:00', channel: 'email', direction: 'outbound', title: 'Reminder sent' },
  { id: 'com_gf_05', customerId: 'cus_greenfield', invoiceId: 'inv-48112', at: '2026-09-24T11:20:00', channel: 'agent', direction: 'internal', title: 'AI flagged active dispute — paused automated reminders' },

  // ── Others ──────────────────────────────────────────────────────────
  { id: 'com_oc_01', customerId: 'cus_oakridge', invoiceId: 'inv-48140', at: '2026-09-12T13:05:00', channel: 'email', direction: 'inbound', title: 'Customer queried variation charge', body: 'The variation for extra excavation was never signed off on our side.' },
  { id: 'com_oc_02', customerId: 'cus_oakridge', invoiceId: 'inv-48140', at: '2026-09-26T10:00:00', channel: 'agent', direction: 'internal', title: 'AI found signed variation order VO-114 in shared drive export' },
  { id: 'com_pf_01', customerId: 'cus_pennine', invoiceId: 'inv-48177', at: '2026-09-20T15:45:00', channel: 'call', direction: 'inbound', title: 'Customer mentioned tight cash flow this quarter' },
  { id: 'com_pf_02', customerId: 'cus_pennine', invoiceId: 'inv-48177', at: '2026-09-25T09:30:00', channel: 'agent', direction: 'internal', title: 'Payment plan drafted (3 instalments)' },
  { id: 'com_md_01', customerId: 'cus_marlow', invoiceId: 'inv-48240', at: '2026-09-23T12:10:00', channel: 'agent', direction: 'internal', title: 'Invoice addressed to Marlow Dental Ltd — trading entity is Marlow Dental Group' },
  { id: 'com_qs_01', customerId: 'cus_quayside', invoiceId: 'inv-48204', at: '2026-09-19T09:00:00', channel: 'email', direction: 'outbound', title: 'Reminder bounced — mailbox no longer exists' },
  { id: 'com_cl_01', customerId: 'cus_copperleaf', invoiceId: 'inv-48198', at: '2026-09-15T17:02:00', channel: 'email', direction: 'inbound', title: 'Customer disputed linen quantity', body: 'We were billed for 420 sets but only received 360.' },
  { id: 'com_hv_01', customerId: 'cus_harbour', invoiceId: 'inv-48155', at: '2026-09-22T09:00:00', channel: 'email', direction: 'outbound', title: 'Second reminder sent' },
  { id: 'com_bo_01', customerId: 'cus_bright', invoiceId: 'inv-48302', at: '2026-09-25T09:00:00', channel: 'email', direction: 'outbound', title: 'Pre-due reminder sent' },
  { id: 'com_bo_02', customerId: 'cus_bright', at: '2026-09-24T14:18:00', channel: 'system', direction: 'internal', title: 'Payment received for INV-48044' },
]
