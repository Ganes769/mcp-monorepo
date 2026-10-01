/**
 * Exports the mock dataset as Xero CSV import files.
 *
 *   npm run export:xero
 *
 * Writes to exports/xero/:
 *   contacts.csv            → Xero: Contacts → Import  (exact header from Xero's template)
 *   sales-invoices.csv      → Xero: Business → Invoices → Import (arrive as Drafts; approve in bulk)
 *   payments-to-record.csv  → checklist for recording paid invoices by hand
 *
 * Use a Demo Company or trial organisation, never a live one.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { customers } from '@/data/customers'
import { invoices } from '@/data/invoices'

const OUT_DIR = join(import.meta.dirname, '..', 'exports', 'xero')
const SALES_ACCOUNT_CODE = '200'
const TAX_TYPE = '20% (VAT on Income)'

/** Exact header from Xero's Contacts import template (UK). Extra Person2–5 columns must be present. */
const CONTACT_HEADERS = [
  '*ContactName', 'AccountNumber', 'EmailAddress', 'FirstName', 'LastName',
  'POAttentionTo', 'POAddressLine1', 'POAddressLine2', 'POAddressLine3', 'POAddressLine4', 'POCity', 'PORegion', 'POPostalCode', 'POCountry',
  'SAAttentionTo', 'SAAddressLine1', 'SAAddressLine2', 'SAAddressLine3', 'SAAddressLine4', 'SACity', 'SARegion', 'SAPostalCode', 'SACountry',
  'PhoneNumber', 'FaxNumber', 'MobileNumber', 'DDINumber', 'SkypeName',
  'BankAccountName', 'BankAccountNumber', 'BankAccountParticulars',
  'TaxNumber', 'AccountsReceivableTaxCodeName', 'AccountsPayableTaxCodeName', 'Website', 'LegalName', 'Discount', 'CompanyNumber',
  'DueDateBillDay', 'DueDateBillTerm', 'DueDateSalesDay', 'DueDateSalesTerm', 'SalesAccount', 'PurchasesAccount',
  'TrackingName1', 'SalesTrackingOption1', 'PurchasesTrackingOption1', 'TrackingName2', 'SalesTrackingOption2', 'PurchasesTrackingOption2',
  'BrandingTheme', 'DefaultTaxBills', 'DefaultTaxSales',
  'Person1FirstName', 'Person1LastName', 'Person1Email', 'Person1IncludeInEmail',
  'Person2FirstName', 'Person2LastName', 'Person2Email', 'Person2IncludeInEmail',
  'Person3FirstName', 'Person3LastName', 'Person3Email', 'Person3IncludeInEmail',
  'Person4FirstName', 'Person4LastName', 'Person4Email', 'Person4IncludeInEmail',
  'Person5FirstName', 'Person5LastName', 'Person5Email', 'Person5IncludeInEmail',
] as const

const INVOICE_HEADERS = [
  '*ContactName', 'EmailAddress',
  'POAddressLine1', 'POAddressLine2', 'POAddressLine3', 'POAddressLine4', 'POCity', 'PORegion', 'POPostalCode', 'POCountry',
  '*InvoiceNumber', 'Reference', '*InvoiceDate', '*DueDate', 'InventoryItemCode',
  '*Description', '*Quantity', '*UnitAmount', 'Discount', '*AccountCode', '*TaxType',
  'TrackingName1', 'TrackingOption1', 'TrackingName2', 'TrackingOption2', 'Currency', 'BrandingTheme',
] as const

const xeroDate = (iso: string) => {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

const csvCell = (value: string | number | null | undefined) => {
  const s = value === null || value === undefined ? '' : String(value)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function toCsv(headers: readonly string[], rows: Array<Record<string, string | number | null | undefined>>): string {
  const lines = [headers.join(','), ...rows.map((row) => headers.map((h) => csvCell(row[h] ?? '')).join(','))]
  return `${lines.join('\r\n')}\r\n`
}

const splitName = (full: string) => {
  const parts = full.replace(/^Dr\.\s*/, '').split(' ')
  return { first: parts[0] ?? '', last: parts.slice(1).join(' ') }
}

const contactRows = customers.map((c) => {
  const { first, last } = splitName(c.contactName)
  const a = c.address
  return {
    '*ContactName': c.name,
    AccountNumber: c.id,
    EmailAddress: c.accountsEmail,
    FirstName: first,
    LastName: last,
    POAttentionTo: c.contactName,
    POAddressLine1: a.line1,
    POAddressLine2: a.line2 ?? '',
    POCity: a.city,
    PORegion: a.region ?? '',
    POPostalCode: a.postcode,
    POCountry: a.country,
    SAAddressLine1: a.line1,
    SAAddressLine2: a.line2 ?? '',
    SACity: a.city,
    SARegion: a.region ?? '',
    SAPostalCode: a.postcode,
    SACountry: a.country,
    PhoneNumber: c.phone,
    TaxNumber: c.vatNumber,
    AccountsReceivableTaxCodeName: TAX_TYPE,
    Website: c.website,
    LegalName: c.legalName,
    CompanyNumber: c.companyNumber,
    DueDateSalesDay: c.paymentTermsDays,
    DueDateSalesTerm: 'DAYSAFTERBILLDATE',
    SalesAccount: SALES_ACCOUNT_CODE,
    DefaultTaxSales: TAX_TYPE,
    Person1FirstName: first,
    Person1LastName: last,
    Person1Email: c.contactEmail,
    Person1IncludeInEmail: 'Yes',
  }
})

const customerName = (id: string) => customers.find((c) => c.id === id)?.name ?? id

const invoiceRows = invoices.flatMap((inv) => {
  const customer = customers.find((c) => c.id === inv.customerId)
  const a = customer?.address
  return inv.lines.map((line) => ({
    '*ContactName': customer?.name ?? inv.customerId,
    EmailAddress: customer?.accountsEmail ?? '',
    POAddressLine1: a?.line1 ?? '',
    POAddressLine2: a?.line2 ?? '',
    POCity: a?.city ?? '',
    PORegion: a?.region ?? '',
    POPostalCode: a?.postcode ?? '',
    POCountry: a?.country ?? '',
    '*InvoiceNumber': inv.invoiceNumber,
    Reference: inv.poReference ?? '',
    '*InvoiceDate': xeroDate(inv.invoiceDate),
    '*DueDate': xeroDate(inv.dueDate),
    '*Description': line.description,
    '*Quantity': line.quantity,
    '*UnitAmount': line.unitPrice,
    '*AccountCode': SALES_ACCOUNT_CODE,
    '*TaxType': TAX_TYPE,
    Currency: inv.currency,
  }))
})

const paymentRows = invoices
  .filter((inv) => inv.paidDate)
  .sort((a, b) => a.paidDate!.localeCompare(b.paidDate!))
  .map((inv) => ({
    InvoiceNumber: inv.invoiceNumber,
    ContactName: customerName(inv.customerId),
    Amount: inv.amount.toFixed(2),
    PaidDate: xeroDate(inv.paidDate!),
    Reference: `Payment ${inv.invoiceNumber}`,
  }))

mkdirSync(OUT_DIR, { recursive: true })
writeFileSync(join(OUT_DIR, 'contacts.csv'), toCsv(CONTACT_HEADERS, contactRows))
writeFileSync(join(OUT_DIR, 'sales-invoices.csv'), toCsv(INVOICE_HEADERS, invoiceRows))
writeFileSync(join(OUT_DIR, 'payments-to-record.csv'), toCsv(['InvoiceNumber', 'ContactName', 'Amount', 'PaidDate', 'Reference'], paymentRows))

console.log(`Wrote ${OUT_DIR}`)
console.log(`  contacts.csv            ${contactRows.length} contacts`)
console.log(`  sales-invoices.csv      ${invoices.length} invoices / ${invoiceRows.length} lines`)
console.log(`  payments-to-record.csv  ${paymentRows.length} payments to record manually`)
console.log('\nImport order in Xero: contacts.csv first, then sales-invoices.csv, then approve the drafts and record payments.')
