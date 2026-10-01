import { useEffect, useRef } from 'react'
import { Link, useParams } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, FileQuestion, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import type { ApprovalWithInvoice } from '@/types'
import { useInvestigation, useInvoice, useStartInvestigation } from '@/hooks/queries'
import { NotFoundError } from '@/services/mockDb'
import { formatDate, formatMoney } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AiStatusBadge, InvoiceStatusBadge } from '@/components/shared/badges'
import { EmptyState, ErrorState, LoadingBlock } from '@/components/shared/states'
import { CommunicationTimeline } from '@/components/shared/CommunicationTimeline'
import { useApprovalDialogs } from '@/components/approvals/ApprovalDialogs'
import { InvoiceInfoPanel } from '@/components/invoice/InvoiceInfoPanel'
import { InvestigationPanel } from '@/components/invoice/InvestigationPanel'
import { RecommendedActionCard } from '@/components/invoice/RecommendedActionCard'
import { AgentStatusPanel } from '@/components/invoice/AgentStatusPanel'

function useLiveInvestigation(invoiceId: string) {
  const queryClient = useQueryClient()
  const query = useInvestigation(invoiceId)
  const start = useStartInvestigation()
  const autoStarted = useRef<string | null>(null)
  const previousState = useRef<string | undefined>(undefined)
  const investigation = query.data ?? null

  // Seeded "running" records have no simulation behind them; resume them once when opened.
  useEffect(() => {
    if (investigation?.state === 'running' && !investigation.live && autoStarted.current !== invoiceId) {
      autoStarted.current = invoiceId
      start.mutate(invoiceId)
    }
  }, [investigation, invoiceId, start])

  // When a run finishes, the invoice, approvals and KPIs have all changed.
  useEffect(() => {
    const state = investigation?.state
    if (previousState.current === 'running' && state === 'completed') {
      void queryClient.invalidateQueries()
      toast('Investigation complete', { description: investigation?.recommendation?.title })
    }
    previousState.current = state
  }, [investigation, queryClient])

  return {
    investigation,
    starting: start.isPending,
    startInvestigation: () => start.mutate(invoiceId, { onError: (err) => toast.error("Couldn't start investigation", { description: err.message }) }),
  }
}

export function InvoiceDetailPage() {
  const { invoiceId = '' } = useParams()
  const { data, isLoading, error, refetch } = useInvoice(invoiceId)
  const { investigation, starting, startInvestigation } = useLiveInvestigation(invoiceId)
  const { open, dialogs } = useApprovalDialogs()

  if (error instanceof NotFoundError) {
    return (
      <Card>
        <EmptyState
          icon={FileQuestion}
          title="Invoice not found"
          description={`We couldn't find an invoice with the id “${invoiceId}”.`}
          action={
            <Button variant="outline" asChild>
              <Link to="/app/invoices">Back to invoices</Link>
            </Button>
          }
        />
      </Card>
    )
  }
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />
  if (isLoading || !data) {
    return (
      <div className="grid gap-4 xl:grid-cols-[270px_1fr_270px]">
        <LoadingBlock className="h-96" />
        <LoadingBlock className="h-[520px]" />
        <LoadingBlock className="h-96" />
      </div>
    )
  }

  const { invoice, customer, approval, timeline, followUps } = data
  const liveInvestigation = investigation ?? data.investigation
  const approvalWithInvoice: ApprovalWithInvoice | null = approval ? { ...approval, invoice, finding: liveInvestigation?.finding ?? null } : null
  const showRecommendation = approvalWithInvoice && liveInvestigation?.state === 'completed'

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link to="/app/invoices" className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-3.5" aria-hidden /> Invoices
          </Link>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl font-semibold tracking-[-0.02em]">{invoice.invoiceNumber}</h1>
            <InvoiceStatusBadge status={invoice.status} className="uppercase tracking-wide" />
            <AiStatusBadge status={invoice.aiStatus} />
          </div>
          <p className="mt-1 text-[13px] text-muted-foreground">
            <Link to={`/app/customers/${customer.id}`} className="font-medium text-foreground hover:underline">
              {customer.name}
            </Link>{' '}
            · <span className="font-semibold text-foreground tabular">{formatMoney(invoice.amountDue, { precise: true })}</span> outstanding · due {formatDate(invoice.dueDate)}
            {invoice.daysOverdue > 0 && <span className="font-medium text-peach-strong"> · {invoice.daysOverdue} days overdue</span>}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link to={`/app/customers/${customer.id}`}>
            <UserRound /> View customer
          </Link>
        </Button>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[270px_minmax(0,1fr)_270px] 2xl:grid-cols-[300px_minmax(0,1fr)_300px]">
        <InvoiceInfoPanel invoice={invoice} customer={customer} />

        <div className="space-y-4">
          <InvestigationPanel investigation={liveInvestigation} onStart={startInvestigation} starting={starting} />
          {showRecommendation && <RecommendedActionCard approval={approvalWithInvoice} onOpen={(mode) => open(mode, approvalWithInvoice)} />}
          <Card>
            <CardHeader>
              <CardTitle>Invoice timeline</CardTitle>
              <CardDescription>Accounting events, customer emails, AI activity and human decisions</CardDescription>
            </CardHeader>
            <CardContent>
              {timeline.length === 0 ? <p className="text-[13px] text-muted-foreground">No activity recorded yet.</p> : <CommunicationTimeline items={timeline} />}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 xl:col-span-1">
          <AgentStatusPanel investigation={liveInvestigation} followUps={followUps} />
        </div>
      </div>
      {dialogs}
    </div>
  )
}
