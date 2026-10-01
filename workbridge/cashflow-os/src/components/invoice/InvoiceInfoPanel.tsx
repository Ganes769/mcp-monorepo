import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { AlertTriangle } from 'lucide-react'
import type { Customer, InvoiceRow } from '@/types'
import { formatDate, formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/misc'
import { RiskBadge } from '@/components/shared/badges'

function Row({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-start justify-between gap-3 py-1.5 text-[13px]', className)}>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{children}</dd>
    </div>
  )
}

export function InvoiceInfoPanel({ invoice, customer }: { invoice: InvoiceRow; customer: Customer }) {
  const poMissing = customer.requiresPo && !invoice.poReference

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Invoice details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl>
            <Row label="Invoice number">{invoice.invoiceNumber}</Row>
            <Row label="Customer">
              <Link to={`/app/customers/${customer.id}`} className="underline-offset-2 hover:underline">
                {customer.name}
              </Link>
            </Row>
            <Row label="Invoice date">{formatDate(invoice.invoiceDate)}</Row>
            <Row label="Due date">{formatDate(invoice.dueDate)}</Row>
            <Row label="Payment terms">{invoice.paymentTermsDays} days</Row>
            <Row label="PO reference">
              {invoice.poReference ?? <span className={poMissing ? 'text-coral' : 'text-muted-foreground'}>Missing</span>}
            </Row>
          </dl>

          {poMissing && (
            <p className="mt-2 flex gap-2 rounded-lg bg-coral-soft px-3 py-2 text-xs text-[#9a2f25]">
              <AlertTriangle className="mt-px size-3.5 shrink-0" aria-hidden />
              <span>
                {customer.name} requires a PO on every invoice.
                {customer.poOnFile && ` ${customer.poOnFile} is on file.`}
              </span>
            </p>
          )}

          <Separator className="my-3" />
          <ul className="space-y-2">
            {invoice.lines.map((line) => (
              <li key={line.description} className="flex justify-between gap-3 text-[12.5px]">
                <span className="text-foreground/80">
                  {line.description}
                  {line.quantity > 1 && <span className="text-muted-foreground"> × {line.quantity}</span>}
                </span>
                <span className="tabular">{formatMoney(line.quantity * line.unitPrice, { precise: true })}</span>
              </li>
            ))}
          </ul>
          <Separator className="my-3" />

          <dl>
            <Row label="Subtotal">
              <span className="tabular">{formatMoney(invoice.subtotal, { precise: true })}</span>
            </Row>
            <Row label="VAT (20%)">
              <span className="tabular">{formatMoney(invoice.vat, { precise: true })}</span>
            </Row>
            <Row label="Total">
              <span className="tabular">{formatMoney(invoice.amount, { precise: true })}</span>
            </Row>
            <Row label="Paid">
              <span className="tabular">{formatMoney(invoice.amountPaid, { precise: true })}</span>
            </Row>
          </dl>
          <div className="mt-2 flex items-center justify-between rounded-lg bg-muted px-3 py-2.5">
            <span className="text-[13px] font-medium">Outstanding</span>
            <span className="text-base font-semibold tabular">{formatMoney(invoice.amountDue, { precise: true })}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Customer snapshot</CardTitle>
        </CardHeader>
        <CardContent>
          <dl>
            <Row label="Company number">{customer.companyNumber}</Row>
            <Row label="VAT number">{customer.vatNumber}</Row>
            <Row label="Address">
              <span className="block max-w-40 text-right font-medium">
                {customer.address.line1}
                {customer.address.line2 ? `, ${customer.address.line2}` : ''}
                {`, ${customer.address.city} ${customer.address.postcode}`}
              </span>
            </Row>
            <Row label="Customer since">{customer.customerSince}</Row>
            <Row label="Avg payment delay">{customer.averagePaymentDelayDays} days</Row>
            <Row label="Previous invoices">{customer.lifetimeInvoiceCount}</Row>
            <Row label="Disputes">{customer.disputesCount}</Row>
            <Row label="Last payment">{customer.lastPaymentDate ? formatDate(customer.lastPaymentDate) : '—'}</Row>
            <Row label="Customer risk">
              <RiskBadge risk={customer.riskLevel} />
            </Row>
          </dl>
          <Link to={`/app/customers/${customer.id}`} className="mt-3 block text-center text-xs font-medium text-muted-foreground hover:text-foreground">
            View payment behaviour →
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
