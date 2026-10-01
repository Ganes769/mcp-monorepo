import { useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { FileSearch, Search } from 'lucide-react'
import type { InvoiceFilter, InvoiceRow } from '@/types'
import { useInvoices } from '@/hooks/queries'
import { matchesFilter } from '@/services/invoiceService'
import { formatDate, formatMoney, relativeDay } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageHeader } from '@/components/shared/PageHeader'
import { AiStatusBadge, InvoiceStatusBadge, RiskBadge } from '@/components/shared/badges'
import { EmptyState, ErrorState, LoadingRows } from '@/components/shared/states'

const FILTERS: Array<{ value: InvoiceFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'due_soon', label: 'Due soon' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'high_value', label: 'High value' },
  { value: 'disputed', label: 'Disputed' },
  { value: 'ai_investigating', label: 'AI investigating' },
  { value: 'awaiting_approval', label: 'Awaiting approval' },
  { value: 'resolved', label: 'Resolved' },
]

const isFilter = (value: string | null): value is InvoiceFilter => FILTERS.some((f) => f.value === value)

function matchesQuery(invoice: InvoiceRow, q: string) {
  if (!q) return true
  const needle = q.toLowerCase()
  return invoice.invoiceNumber.toLowerCase().includes(needle) || invoice.customerName.toLowerCase().includes(needle) || (invoice.poReference ?? '').toLowerCase().includes(needle)
}

export function InvoicesPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const filterParam = params.get('filter')
  const filter: InvoiceFilter = isFilter(filterParam) ? filterParam : 'all'
  const query = params.get('q') ?? ''
  const { data, isLoading, error, refetch } = useInvoices()

  const update = (key: 'filter' | 'q', value: string) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (!value || value === 'all') next.delete(key)
        else next.set(key, value)
        return next
      },
      { replace: true },
    )

  const counts = useMemo(() => {
    const result = {} as Record<InvoiceFilter, number>
    for (const f of FILTERS) result[f.value] = data?.filter((i) => matchesFilter(i, f.value)).length ?? 0
    return result
  }, [data])

  const rows = useMemo(() => data?.filter((i) => matchesFilter(i, filter) && matchesQuery(i, query.trim())) ?? [], [data, filter, query])
  const total = rows.reduce((s, i) => s + i.amountDue, 0)

  return (
    <div className="space-y-5">
      <PageHeader title="Invoices" description="Receivables from your connected Xero organisation." />

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center">
          <div className="relative w-full lg:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input value={query} onChange={(e) => update('q', e.target.value)} placeholder="Search invoice, customer or PO…" className="pl-9" aria-label="Search invoices" />
          </div>
          <div className="scrollbar-thin -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5" role="group" aria-label="Filter invoices">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                aria-pressed={filter === f.value}
                onClick={() => update('filter', f.value)}
                className={cn(
                  'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[12.5px] font-medium transition-colors',
                  filter === f.value ? 'border-primary bg-primary text-primary-foreground' : 'bg-card text-foreground/75 hover:bg-muted',
                )}
              >
                {f.label}
                <span className={cn('tabular text-[11px]', filter === f.value ? 'text-primary-foreground/70' : 'text-muted-foreground')}>{counts[f.value]}</span>
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : isLoading ? (
          <LoadingRows rows={8} />
          ) : rows.length === 0 ? (
            <EmptyState
              icon={FileSearch}
              title={data?.length ? 'No invoices match' : 'No invoices yet'}
              description={data?.length ? 'Try a different filter or search term.' : 'Connect Xero, then invoices from your organisation appear here.'}
            />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Invoice</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Due date</TableHead>
                  <TableHead className="text-right">Days overdue</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>AI status</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Last action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((inv) => (
                  <TableRow
                    key={inv.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/app/invoices/${inv.id}`)}
                  >
                    <TableCell className="font-semibold">
                      <Link to={`/app/invoices/${inv.id}`} className="hover:underline" onClick={(e) => e.stopPropagation()}>
                        {inv.invoiceNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{inv.customerName}</TableCell>
                    <TableCell className="text-right font-medium tabular">{formatMoney(inv.status === 'paid' ? inv.amount : inv.amountDue)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(inv.dueDate)}</TableCell>
                    <TableCell className={cn('text-right tabular', inv.daysOverdue > 14 ? 'font-semibold text-peach-strong' : inv.daysOverdue > 0 ? 'font-medium' : 'text-muted-foreground')}>
                      {inv.daysOverdue > 0 ? inv.daysOverdue : '—'}
                    </TableCell>
                    <TableCell>
                      <InvoiceStatusBadge status={inv.status} />
                    </TableCell>
                    <TableCell>
                      <AiStatusBadge status={inv.aiStatus} />
                    </TableCell>
                    <TableCell>
                      <RiskBadge risk={inv.riskLevel} />
                    </TableCell>
                    <TableCell className="max-w-56">
                      <span className="block truncate text-[12.5px]">{inv.lastAction.label}</span>
                      <span className="block text-[11px] text-muted-foreground">{relativeDay(inv.lastAction.at)}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex items-center justify-between border-t px-5 py-3 text-xs text-muted-foreground">
              <span>
                {rows.length} of {data?.length ?? 0} invoices
              </span>
              <span>
                Outstanding in view: <span className="font-semibold text-foreground tabular">{formatMoney(total)}</span>
              </span>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
