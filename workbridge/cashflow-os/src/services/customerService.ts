import type { CustomerDetail, CustomerSummary } from '@/types'
import { mapXeroContactToCustomer } from '@/lib/xeroMap'
import { NotFoundError } from './mockDb'
import { isOverdue, isUnpaid, liveInvoiceRows, liveXeroContacts } from './invoiceService'

export async function getCustomers(): Promise<CustomerSummary[]> {
  const [contacts, invoices] = await Promise.all([liveXeroContacts(), liveInvoiceRows()])
  return contacts
    .map((contact) => {
      const customer = mapXeroContactToCustomer(contact, invoices)
      const open = invoices.filter((i) => (i.customerId === customer.id || i.customerName === customer.name) && isUnpaid(i))
      return {
        ...customer,
        outstanding: open.reduce((sum, i) => sum + i.amountDue, 0),
        overdue: open.filter(isOverdue).reduce((sum, i) => sum + i.amountDue, 0),
        openInvoices: open.length,
      }
    })
    .sort((a, b) => b.overdue - a.overdue || b.outstanding - a.outstanding)
}

export async function getCustomer(id: string): Promise<CustomerDetail> {
  const [customers, invoices] = await Promise.all([getCustomers(), liveInvoiceRows()])
  const customer = customers.find((c) => c.id === id || c.name.toLowerCase() === id.toLowerCase())
  if (!customer) throw new NotFoundError('Customer', id)
  const related = invoices.filter((i) => i.customerId === customer.id || i.customerName === customer.name)
  return {
    customer,
    invoices: related.sort((a, b) => b.dueDate.localeCompare(a.dueDate)),
    payments: related
      .filter((i) => i.paidDate)
      .map((i) => ({
        id: i.id,
        customerId: customer.id,
        invoiceNumber: i.invoiceNumber,
        amount: i.amount,
        dueDate: i.dueDate,
        paidDate: i.paidDate!,
        daysLate: i.daysOverdue,
      })),
    timeline: [],
  }
}
