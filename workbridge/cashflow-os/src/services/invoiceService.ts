import type { Invoice, InvoiceDetail, InvoiceFilter, InvoiceRow, SearchResult } from '@/types'
import { xeroApi } from '@/api/xero'
import { mapSyncedInvoice, mapXeroContactToCustomer, syncedContactToXero } from '@/lib/xeroMap'
import { daysOverdue } from '@/lib/dates'
import { formatMoney } from '@/lib/format'
import { appPath } from '@/lib/paths'
import { ApiError } from '@/api/client'
import { NotFoundError, db, latency } from './mockDb'

export const HIGH_VALUE_THRESHOLD = 5_000

export function isUnpaid(invoice: Invoice): boolean {
  return invoice.status !== 'paid'
}

export function isOverdue(invoice: Invoice): boolean {
  return invoice.status === 'overdue' || invoice.status === 'disputed'
}

export function toRow(invoice: Invoice): InvoiceRow {
  const customer = db.customers.find((c) => c.id === invoice.customerId)
  return {
    ...invoice,
    customerName: customer?.name ?? 'Unknown customer',
    daysOverdue: isOverdue(invoice) ? daysOverdue(invoice.dueDate) : 0,
  }
}

const FILTERS: Record<InvoiceFilter, (invoice: Invoice) => boolean> = {
  all: () => true,
  due_soon: (i) => i.status === 'due_soon',
  overdue: isOverdue,
  high_value: (i) => isUnpaid(i) && i.amountDue >= HIGH_VALUE_THRESHOLD,
  disputed: (i) => i.status === 'disputed',
  ai_investigating: (i) => i.aiStatus === 'investigating',
  awaiting_approval: (i) => i.aiStatus === 'awaiting_approval' || i.aiStatus === 'needs_review',
  resolved: (i) => i.status === 'paid' || i.aiStatus === 'resolved',
}

export function matchesFilter(invoice: Invoice, filter: InvoiceFilter): boolean {
  return FILTERS[filter](invoice)
}

export async function liveInvoiceRows(): Promise<InvoiceRow[]> {
  const synced = await xeroApi.syncedInvoices()
  return (synced.invoices ?? [])
    .map(mapSyncedInvoice)
    .filter((row): row is InvoiceRow => row !== null)
    .sort((a, b) => b.daysOverdue - a.daysOverdue || a.dueDate.localeCompare(b.dueDate))
}

export async function liveXeroContacts() {
  try {
    const synced = await xeroApi.syncedContacts()
    return (synced.contacts ?? []).map(syncedContactToXero).filter((c): c is NonNullable<typeof c> => c !== null)
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 502)) {
      return []
    }
    throw error
  }
}

export async function getInvoices(): Promise<InvoiceRow[]> {
  return liveInvoiceRows()
}

export async function getOverdueInvoices(): Promise<InvoiceRow[]> {
  const all = await getInvoices()
  return all.filter(isOverdue)
}

export async function getInvoice(id: string): Promise<InvoiceDetail> {
  const [invoices, contacts] = await Promise.all([liveInvoiceRows(), liveXeroContacts().catch(() => [])])
  const live = invoices.find((row) => row.id === id || row.invoiceNumber === id)
  if (live) {
    const xero = contacts.find((c) => c.contact_id === live.customerId || c.name === live.customerName)
    const mapped = xero ? mapXeroContactToCustomer(xero, invoices) : null
    return {
      invoice: live,
      customer: mapped ?? {
        id: live.customerId || live.id,
        name: live.customerName,
        legalName: live.customerName,
        companyNumber: '',
        vatNumber: '',
        industry: 'Xero contact',
        customerSince: new Date().getFullYear(),
        contactName: live.customerName,
        contactEmail: '',
        accountsEmail: '',
        phone: '',
        website: '',
        address: { line1: '', city: '', postcode: '', country: 'United Kingdom' },
        paymentTermsDays: live.paymentTermsDays,
        requiresPo: Boolean(live.poReference),
        poOnFile: live.poReference,
        averagePaymentDelayDays: live.daysOverdue,
        lifetimeInvoiceCount: 1,
        disputesCount: live.status === 'disputed' ? 1 : 0,
        riskLevel: live.riskLevel,
        lastPaymentDate: live.paidDate ?? null,
      },
      investigation: db.investigations.find((i) => i.invoiceId === id) ?? null,
      approval: db.approvals.find((a) => a.invoiceId === id && a.status === 'pending') ?? db.approvals.find((a) => a.invoiceId === id) ?? null,
      timeline: db.communications.filter((c) => c.invoiceId === id).sort((a, b) => a.at.localeCompare(b.at)),
      followUps: db.followUps.filter((f) => f.invoiceId === id),
    }
  }

  await latency()
  const invoice = db.invoices.find((i) => i.id === id)
  if (!invoice) throw new NotFoundError('Invoice', id)
  const customer = db.customers.find((c) => c.id === invoice.customerId)
  if (!customer) throw new NotFoundError('Customer', invoice.customerId)
  const approvals = db.approvals.filter((a) => a.invoiceId === id)
  return {
    invoice: toRow(invoice),
    customer,
    investigation: db.investigations.find((i) => i.invoiceId === id) ?? null,
    approval: approvals.find((a) => a.status === 'pending') ?? approvals.at(-1) ?? null,
    timeline: db.communications.filter((c) => c.invoiceId === id).sort((a, b) => a.at.localeCompare(b.at)),
    followUps: db.followUps.filter((f) => f.invoiceId === id),
  }
}

export async function search(query: string): Promise<SearchResult[]> {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const [invoices, contacts] = await Promise.all([liveInvoiceRows(), liveXeroContacts().catch(() => [])])
  const customerHits: SearchResult[] = contacts
    .filter((c) => c.name.toLowerCase().includes(q) || (c.email_address ?? '').toLowerCase().includes(q))
    .map((c) => ({ type: 'customer' as const, id: c.contact_id, title: c.name, subtitle: c.email_address || c.account_number || '', href: appPath(`/customers/${c.contact_id}`) }))
  const invoiceHits: SearchResult[] = invoices
    .filter((i) => i.invoiceNumber.toLowerCase().includes(q) || i.customerName.toLowerCase().includes(q) || (i.poReference ?? '').toLowerCase().includes(q))
    .map((i) => ({ type: 'invoice' as const, id: i.id, title: i.invoiceNumber, subtitle: `${i.customerName} · ${formatMoney(i.amountDue || i.amount)}`, href: appPath(`/invoices/${i.id}`) }))
  return [...customerHits.slice(0, 4), ...invoiceHits.slice(0, 6)]
}
