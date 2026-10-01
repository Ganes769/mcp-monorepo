import { useState } from 'react'
import { Link } from 'react-router'
import { BadgeCheck, Pencil, ScanSearch, Send, ShieldAlert, X } from 'lucide-react'
import type { ApprovalWithInvoice } from '@/types'
import { useApprovals } from '@/hooks/queries'
import { formatDateTime, formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader } from '@/components/shared/PageHeader'
import { RiskBadge } from '@/components/shared/badges'
import { AiLabel, ConfidenceMeter } from '@/components/shared/ai'
import { EmptyState, ErrorState, LoadingRows } from '@/components/shared/states'
import { useApprovalDialogs, type ApprovalDialogMode } from '@/components/approvals/ApprovalDialogs'

type View = 'pending' | 'decided'

function ApprovalCard({ approval, onOpen }: { approval: ApprovalWithInvoice; onOpen: (mode: ApprovalDialogMode) => void }) {
  const { invoice, action } = approval
  const reviewRequired = action.approvalMode === 'review_required'
  const pending = approval.status === 'pending'

  return (
    <Card className={cn('gap-4 p-5', pending && approval.priority === 'high' && 'border-l-4 border-l-peach')}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 text-[13px]">
            <Link to={`/app/invoices/${invoice.id}`} className="font-semibold hover:underline">
              {invoice.invoiceNumber}
            </Link>
            <span className="text-muted-foreground">·</span>
            <Link to={`/app/customers/${invoice.customerId}`} className="hover:underline">
              {invoice.customerName}
            </Link>
            <span className="text-muted-foreground">·</span>
            <span className="font-semibold tabular">{formatMoney(invoice.amountDue)}</span>
            {invoice.daysOverdue > 0 && <span className="text-xs text-peach-strong">{invoice.daysOverdue} days overdue</span>}
            {pending && approval.priority === 'high' && <Badge variant="default">High priority</Badge>}
          </p>
          <h3 className="mt-2 text-base font-semibold">{action.title}</h3>
          <p className="mt-0.5 text-[13px] text-muted-foreground">{action.reason}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3 lg:flex-col lg:items-end">
          <RiskBadge risk={action.risk} withLabel />
          <ConfidenceMeter value={action.confidence} compact />
        </div>
      </div>

      {approval.finding && (
        <div className="rounded-lg bg-muted/60 px-3 py-2.5 text-[13px]">
          <AiLabel className="mb-1">AI finding · hypothesis</AiLabel>
          <p className="text-foreground/80">{approval.finding}</p>
        </div>
      )}

      <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          {pending ? `Requested ${formatDateTime(approval.createdAt)}` : `${approval.status === 'approved' ? 'Approved' : 'Rejected'} by ${approval.decidedBy ?? '—'}${approval.decidedAt ? ` · ${formatDateTime(approval.decidedAt)}` : ''}`}
          {approval.note && ` · “${approval.note}”`}
        </p>
        {pending ? (
          reviewRequired ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs text-[#9a2f25]">
                <ShieldAlert className="size-3.5" aria-hidden /> Human review required
              </span>
              <Button size="sm" variant="outline" asChild>
                <Link to={`/app/invoices/${invoice.id}`}>
                  <ScanSearch /> Investigate
                </Link>
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onOpen('reject')}>
                <X /> Dismiss
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => onOpen('approve')}>
                <Send /> Approve &amp; send
              </Button>
              <Button size="sm" variant="outline" onClick={() => onOpen('edit')}>
                <Pencil /> Edit
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onOpen('reject')}>
                <X /> Reject
              </Button>
            </div>
          )
        ) : (
          <Badge variant={approval.status === 'approved' ? 'lime' : 'muted'}>{approval.status === 'approved' ? 'Approved' : 'Rejected'}</Badge>
        )}
      </div>
    </Card>
  )
}

export function ApprovalsPage() {
  const [view, setView] = useState<View>('pending')
  const { data, isLoading, error, refetch } = useApprovals()
  const { open, dialogs } = useApprovalDialogs()
  const pending = data?.filter((a) => a.status === 'pending') ?? []
  const decided = data?.filter((a) => a.status !== 'pending').sort((a, b) => (b.decidedAt ?? '').localeCompare(a.decidedAt ?? '')) ?? []
  const items = view === 'pending' ? pending : decided

  return (
    <div className="space-y-5">
      <PageHeader
        title="Approval Centre"
        description="The agent never contacts a customer or changes an invoice without a human decision here."
        actions={
          <Tabs value={view} onValueChange={(v) => setView(v as View)}>
            <TabsList>
              <TabsTrigger value="pending">
                Pending <span className="tabular text-muted-foreground">{pending.length}</span>
              </TabsTrigger>
              <TabsTrigger value="decided">
                Decided <span className="tabular text-muted-foreground">{decided.length}</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        }
      />

      {error ? (
        <Card>
          <ErrorState error={error} onRetry={() => refetch()} />
        </Card>
      ) : isLoading ? (
        <Card>
          <LoadingRows rows={5} />
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <EmptyState
            icon={BadgeCheck}
            title={view === 'pending' ? 'No approvals waiting' : 'No decisions yet'}
            description={view === 'pending' ? 'New AI recommendations will appear here.' : 'Approved and rejected actions will be listed here.'}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <ApprovalCard key={a.id} approval={a} onOpen={(mode) => open(mode, a)} />
          ))}
        </div>
      )}
      {dialogs}
    </div>
  )
}
