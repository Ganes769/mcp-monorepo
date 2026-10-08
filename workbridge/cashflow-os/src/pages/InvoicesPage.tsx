import { useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { FileSearch, Search } from 'lucide-react'
import { isXeroConnected } from '@/api/auth'
import { ApiError } from '@/api/client'
import { useSyncedInvoices, useXeroStatus } from '@/hooks/useXero'
import {
  activeInvoices,
  invoiceAmount,
  invoiceContactName,
  invoiceDueDate,
  invoiceXeroStatus,
  invoiceStatusTone,
  matchesInvoiceFilter,
  type InvoiceListFilter,
} from '@/lib/xeroFields'
import { formatDate, formatDateTime, formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState, ErrorState, LoadingRows } from '@/components/shared/states'
import { ConnectXeroButton } from '@/components/auth/ConnectXeroButton'
import { SyncNowButton, XeroLiveBadge } from '@/components/xero/XeroLiveBadge'

const FILTERS: Array<{ value: InvoiceListFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
]

const isFilter = (value: string | null): value is InvoiceListFilter => FILTERS.some((f) => f.value === value)

export function InvoicesPage() {
  const [params, setParams] = useSearchParams()
  const filterParam = params.get('filter')
  const filter: InvoiceListFilter = isFilter(filterParam) ? filterParam : 'all'
  const query = params.get('q') ?? ''
  const status = useXeroStatus()
  const connected = isXeroConnected(status.data)
  const { data, isLoading, error, refetch } = useSyncedInvoices(true)
  const invoices = useMemo(() => activeInvoices(data?.invoices), [data])

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
    const result = {} as Record<InvoiceListFilter, number>
    for (const f of FILTERS) result[f.value] = invoices.filter((row) => matchesInvoiceFilter(row, f.value)).length
    return result
  }, [invoices])

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return invoices.filter((row) => {
      if (!matchesInvoiceFilter(row, filter)) return false
      if (!q) return true
      const haystack = [row.invoice_number, invoiceContactName(row), invoiceXeroStatus(row)].join(' ').toLowerCase()
      return haystack.includes(q)
    })
  }, [invoices, filter, query])

  const unauthorized = error instanceof ApiError && error.status === 401

  return (
    <div className="space-y-5">
      <PageHeader
        title="Invoices"
        description="Invoices stored from your Xero organisation."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <XeroLiveBadge />
            <SyncNowButton />
            <ConnectXeroButton size="sm" hideWhenConnected loginUrl={status.data?.login_url} error={error} />
          </div>
        }
      />

      {!connected && !invoices.length && !isLoading && !error ? (
        <Card>
          <EmptyState
            icon={FileSearch}
            title="Xero is not connected"
            description="Connect Xero, then invoices from your organisation appear here."
            action={<ConnectXeroButton loginUrl={status.data?.login_url} />}
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center">
            <div className="relative w-full lg:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input value={query} onChange={(e) => update('q', e.target.value)} placeholder="Search invoice or contact…" className="pl-9" aria-label="Search invoices" />
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

          {unauthorized ? (
            <EmptyState
              icon={FileSearch}
              title="Connect Xero to load invoices"
              description="Your Xero session is missing or expired."
              action={<ConnectXeroButton loginUrl={status.data?.login_url} error={error} />}
            />
          ) : error ? (
            <ErrorState error={error} onRetry={() => refetch()} />
          ) : isLoading ? (
            <LoadingRows rows={8} />
          ) : rows.length === 0 ? (
            <EmptyState
              icon={FileSearch}
              title={invoices.length ? 'No invoices match' : 'No invoices yet'}
              description={invoices.length ? 'Try a different filter or search term.' : 'Sync now or import from Xero, then invoices appear here.'}
              action={!invoices.length ? <SyncNowButton /> : undefined}
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Invoice</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Due date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((inv) => {
                    const xeroStatus = invoiceXeroStatus(inv) || 'DRAFT'
                    return (
                      <TableRow key={inv.id}>
                        <TableCell className="font-semibold">{inv.invoice_number || inv.id}</TableCell>
                        <TableCell>{invoiceContactName(inv)}</TableCell>
                        <TableCell className="text-right font-medium tabular">{formatMoney(invoiceAmount(inv), { precise: true })}</TableCell>
                        <TableCell className="text-muted-foreground">{invoiceDueDate(inv) ? formatDate(invoiceDueDate(inv)) : '—'}</TableCell>
                        <TableCell>
                          <Badge variant={invoiceStatusTone(xeroStatus)}>{xeroStatus}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{inv.updated_at ? formatDateTime(inv.updated_at) : '—'}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
              <div className="border-t px-5 py-3 text-xs text-muted-foreground">
                {rows.length} of {invoices.length} invoices
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  )
}
