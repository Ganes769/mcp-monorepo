import { Link, useNavigate, useParams } from 'react-router'
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowLeft, Mail, UserRoundX } from 'lucide-react'
import { useCustomer } from '@/hooks/queries'
import { NotFoundError } from '@/services/mockDb'
import { formatDate, formatMoney, initials } from '@/lib/format'
import { CHART, axisProps } from '@/lib/chart'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/misc'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AiStatusBadge, InvoiceStatusBadge, RiskBadge } from '@/components/shared/badges'
import { CommunicationTimeline } from '@/components/shared/CommunicationTimeline'
import { ChartTooltip } from '@/components/charts/ChartTooltip'
import { EmptyState, ErrorState, LoadingBlock } from '@/components/shared/states'

function Metric({ label, value, className }: { label: string; value: string | number; className?: string }) {
  return (
    <div className="rounded-lg border bg-card px-3 py-2.5">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={cn('mt-0.5 text-lg font-semibold tabular', className)}>{value}</p>
    </div>
  )
}

export function CustomerDetailPage() {
  const { customerId = '' } = useParams()
  const navigate = useNavigate()
  const { data, isLoading, error, refetch } = useCustomer(customerId)

  if (error instanceof NotFoundError) {
    return (
      <Card>
        <EmptyState
          icon={UserRoundX}
          title="Customer not found"
          action={
            <Button variant="outline" asChild>
              <Link to="/app/customers">Back to customers</Link>
            </Button>
          }
        />
      </Card>
    )
  }
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />
  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <LoadingBlock className="h-28" />
        <div className="grid gap-4 lg:grid-cols-2">
          <LoadingBlock className="h-72" />
          <LoadingBlock className="h-72" />
        </div>
      </div>
    )
  }

  const { customer, invoices, payments, timeline } = data
  const chartData = [...payments].sort((a, b) => a.paidDate.localeCompare(b.paidDate)).map((p) => ({ label: p.invoiceNumber, daysLate: p.daysLate, amount: p.amount }))
  const onTime = payments.filter((p) => p.daysLate <= 0).length

  return (
    <div className="space-y-5">
      <div>
        <Link to="/app/customers" className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" aria-hidden /> Customers
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="size-11 rounded-xl">
              <AvatarFallback className="rounded-xl text-sm">{initials(customer.name)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold tracking-[-0.02em]">{customer.name}</h1>
                <RiskBadge risk={customer.riskLevel} withLabel />
              </div>
              <p className="text-[13px] text-muted-foreground">
                {customer.industry} · {customer.address.city} · customer since {customer.customerSince} · {customer.paymentTermsDays}-day terms
                {customer.requiresPo && ' · PO required'}
              </p>
            </div>
          </div>
          <div className="text-[13px] sm:text-right">
            <p className="font-medium">{customer.contactName}</p>
            <a href={`mailto:${customer.accountsEmail}`} className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
              <Mail className="size-3.5" aria-hidden /> {customer.accountsEmail}
            </a>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
        <Metric label="Outstanding" value={formatMoney(customer.outstanding)} />
        <Metric label="Overdue" value={formatMoney(customer.overdue)} className={customer.overdue > 0 ? 'text-peach-strong' : undefined} />
        <Metric label="Open invoices" value={customer.openInvoices} />
        <Metric label="Avg payment delay" value={`${customer.averagePaymentDelayDays} days`} />
        <Metric label="Disputes" value={customer.disputesCount} />
        <Metric label="PO on file" value={customer.poOnFile ?? '—'} />
        <Metric label="VAT" value={customer.vatNumber} />
        <Metric label="Phone" value={customer.phone} />
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment behaviour</CardTitle>
              <CardDescription>
                Days late per paid invoice · {onTime} of {payments.length} paid on time
              </CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <p className="py-10 text-center text-[13px] text-muted-foreground">No payment history yet.</p>
              ) : (
                <div className="h-56" role="img" aria-label={`Days late for the last ${chartData.length} payments`}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                      <CartesianGrid vertical={false} stroke={CHART.grid} strokeDasharray="3 3" />
                      <XAxis dataKey="label" {...axisProps} tick={{ ...axisProps.tick, fontSize: 10 }} />
                      <YAxis {...axisProps} width={40} tickFormatter={(v: number) => `${v}d`} />
                      <ReferenceLine y={customer.averagePaymentDelayDays} stroke={CHART.ink} strokeDasharray="4 4" label={{ value: `avg ${customer.averagePaymentDelayDays}d`, position: 'insideTopRight', fill: CHART.axis, fontSize: 10 }} />
                      <Tooltip cursor={{ fill: CHART.bar, opacity: 0.5 }} content={<ChartTooltip formatValue={(v) => `${v} days late`} />} />
                      <Bar dataKey="daysLate" name="Days late" radius={[6, 6, 6, 6]} maxBarSize={32}>
                        {chartData.map((d) => (
                          <Cell key={d.label} fill={d.daysLate <= 0 ? CHART.lime : d.daysLate <= 7 ? CHART.sun : d.daysLate <= 14 ? CHART.peach : CHART.coral} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle>Invoices</CardTitle>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Invoice</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>AI status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id} className="cursor-pointer" onClick={() => navigate(`/app/invoices/${inv.id}`)}>
                    <TableCell className="font-semibold">
                      <Link to={`/app/invoices/${inv.id}`} className="hover:underline" onClick={(e) => e.stopPropagation()}>
                        {inv.invoiceNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right tabular">{formatMoney(inv.status === 'paid' ? inv.amount : inv.amountDue)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(inv.dueDate)}
                      {inv.daysOverdue > 0 && <span className="ml-1.5 text-peach-strong">+{inv.daysOverdue}d</span>}
                    </TableCell>
                    <TableCell>
                      <InvoiceStatusBadge status={inv.status} />
                    </TableCell>
                    <TableCell>
                      <AiStatusBadge status={inv.aiStatus} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Communication timeline</CardTitle>
            <CardDescription>Emails, accounting events, AI findings and team actions</CardDescription>
          </CardHeader>
          <CardContent>
            {timeline.length === 0 ? <p className="text-[13px] text-muted-foreground">No communications recorded.</p> : <CommunicationTimeline items={[...timeline].reverse()} showInvoice />}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
