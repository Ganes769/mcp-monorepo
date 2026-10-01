import { useState } from 'react'
import { Link } from 'react-router'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Bot,
  CalendarClock,
  CheckCheck,
  Coins,
  Database,
  FileWarning,
  ScanSearch,
  Timer,
  UserCheck,
  Wallet,
  Zap,
} from 'lucide-react'
import type { ApprovalWithInvoice, CollectionRange, RiskBucket } from '@/types'
import { useApprovals, useCollections, useOverview, useRiskDistribution } from '@/hooks/queries'
import { currentUser } from '@/data/settings'
import { calendarToday } from '@/lib/dates'
import { formatDate, formatMoney, pluralize } from '@/lib/format'
import { CHART, axisProps } from '@/lib/chart'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { KpiCard } from '@/components/shared/KpiCard'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState, ErrorState, LoadingBlock, LoadingRows } from '@/components/shared/states'
import { AiLabel } from '@/components/shared/ai'
import { ChartTooltip } from '@/components/charts/ChartTooltip'
import { useApprovalDialogs } from '@/components/approvals/ApprovalDialogs'

const RANGES: Array<{ value: CollectionRange; label: string }> = [
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: '90d', label: '90D' },
  { value: '6m', label: '6M' },
]

function Kpis() {
  const { data, isLoading, error, refetch } = useOverview()
  if (error) return <ErrorState error={error} onRetry={() => refetch()} className="rounded-xl border bg-card" />
  const d = data
  const loading = isLoading || !d
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <KpiCard loading={loading} label="Outstanding" icon={Wallet} value={d && formatMoney(d.outstanding)} subtitle={d && `Across ${d.unpaidCount} unpaid invoices`} />
      <KpiCard
        loading={loading}
        highlight
        label="Overdue"
        icon={AlertCircle}
        value={d && formatMoney(d.overdue)}
        subtitle={d && `${d.overdueCount} invoices`}
        trend={d && { label: `${d.outstanding ? Math.round((d.overdue / d.outstanding) * 100) : 0}% of book`, direction: 'up', positive: false }}
      />
      <KpiCard
        loading={loading}
        label="Recovered this month"
        icon={Coins}
        value={d && formatMoney(d.recoveredThisMonth)}
        subtitle="vs last month"
        trend={d && { label: `${d.recoveredChangePct > 0 ? '+' : ''}${d.recoveredChangePct}%`, direction: d.recoveredChangePct >= 0 ? 'up' : 'down', positive: d.recoveredChangePct >= 0 }}
      />
      <KpiCard
        loading={loading}
        label="Avg days overdue"
        icon={Timer}
        value={d?.averageDaysOverdue.toFixed(1)}
        subtitle="vs last month"
        trend={d && { label: `${d.averageDaysOverdueChange > 0 ? '+' : ''}${d.averageDaysOverdueChange} days`, direction: d.averageDaysOverdueChange > 0 ? 'up' : 'down', positive: d.averageDaysOverdueChange <= 0 }}
      />
      <KpiCard
        loading={loading}
        label="AI actions today"
        icon={Zap}
        value={d?.aiActions}
        subtitle={d && `${d.aiActionsAutomatic} completed automatically`}
        trend={d && d.aiActions > 0 ? { label: `${Math.round((d.aiActionsAutomatic / d.aiActions) * 100)}%`, direction: 'up', positive: true } : undefined}
      />
      <KpiCard
        loading={loading}
        label="Human approvals"
        icon={UserCheck}
        value={d?.pendingApprovals}
        subtitle={d && `${d.highPriorityApprovals} high priority`}
        trend={d && d.highPriorityApprovals > 0 ? { label: 'Action needed', direction: 'up', positive: false } : undefined}
      />
    </div>
  )
}

function CollectionChart() {
  const [range, setRange] = useState<CollectionRange>('6m')
  const { data, isLoading, error, refetch } = useCollections(range)
  const totalCollected = data?.reduce((s, p) => s + p.collected, 0) ?? 0

  return (
    <Card className="xl:col-span-2">
      <CardHeader>
        <CardTitle>Collection performance</CardTitle>
        <CardDescription>
          Collected vs overdue balance · <span className="font-semibold text-foreground tabular">{formatMoney(totalCollected)}</span> collected in period
        </CardDescription>
        <CardAction>
          <Tabs value={range} onValueChange={(v) => setRange(v as CollectionRange)}>
            <TabsList aria-label="Chart range">
              {RANGES.map((r) => (
                <TabsTrigger key={r.value} value={r.value} className="px-2.5 text-xs">
                  {r.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="mb-3 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-lime" aria-hidden /> Collected
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-peach" aria-hidden /> Overdue balance
          </span>
        </div>
        {error ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : isLoading || !data ? (
          <LoadingBlock className="h-64" />
        ) : (
          <div className="h-64" role="img" aria-label={`Bar chart of collected versus overdue amounts for the last ${range}`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} barGap={4} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={CHART.grid} strokeDasharray="3 3" />
                <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" minTickGap={8} />
                <YAxis {...axisProps} width={52} tickFormatter={(v: number) => formatMoney(v, { compact: true })} />
                <Tooltip cursor={{ fill: CHART.bar, opacity: 0.5 }} content={<ChartTooltip formatValue={(v) => formatMoney(v)} />} />
                <Bar dataKey="collected" name="Collected" fill={CHART.lime} radius={[6, 6, 6, 6]} maxBarSize={28} />
                <Bar dataKey="overdue" name="Overdue balance" fill={CHART.peach} radius={[6, 6, 6, 6]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

const RISK_COLOR: Record<RiskBucket['key'], string> = { low: CHART.lime, medium: CHART.sun, high: CHART.peach, disputed: CHART.coral }

function RiskDistribution() {
  const { data, isLoading, error, refetch } = useRiskDistribution()
  const total = data?.reduce((s, b) => s + b.count, 0) ?? 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Risk distribution</CardTitle>
        <CardDescription>Overdue and due-soon invoices by AI-assessed risk</CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : isLoading || !data ? (
          <LoadingBlock className="h-64" />
        ) : (
          <div className="flex flex-col gap-4">
            <div className="relative mx-auto size-44" role="img" aria-label={data.map((b) => `${b.label}: ${b.count}`).join(', ')}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data} dataKey="count" nameKey="label" innerRadius="68%" outerRadius="100%" paddingAngle={3} cornerRadius={5} stroke="none" startAngle={90} endAngle={-270} isAnimationActive={false}>
                    {data.map((b) => (
                      <Cell key={b.key} fill={RISK_COLOR[b.key]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip formatValue={(v) => pluralize(v, 'invoice')} />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-semibold tabular">{total}</span>
                <span className="text-[11px] text-muted-foreground">invoices watched</span>
              </div>
            </div>
            <ul className="grid grid-cols-2 gap-2">
              {data.map((b) => (
                <li key={b.key} className="rounded-lg border px-3 py-2">
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="size-2 rounded-full" style={{ background: RISK_COLOR[b.key] }} aria-hidden />
                    {b.label}
                  </p>
                  <p className="mt-0.5 flex items-baseline justify-between gap-2">
                    <span className="text-lg font-semibold tabular">{b.count}</span>
                    <span className="text-[11px] text-muted-foreground tabular">{formatMoney(b.amount, { compact: true })}</span>
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function AttentionItem({ approval, onOpen }: { approval: ApprovalWithInvoice; onOpen: (mode: 'approve' | 'reject', a: ApprovalWithInvoice) => void }) {
  const { invoice } = approval
  const reviewRequired = approval.action.approvalMode === 'review_required'
  return (
    <li className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center">
      <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg', reviewRequired ? 'bg-coral-soft text-coral' : 'bg-peach-soft text-peach-strong')}>
        {reviewRequired ? <FileWarning className="size-4" aria-hidden /> : <CheckCheck className="size-4" aria-hidden />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13.5px]">
          <Link to={`/app/invoices/${invoice.id}`} className="font-semibold hover:underline">
            {invoice.invoiceNumber}
          </Link>
          <span className="text-muted-foreground">·</span>
          <span className="font-medium">{invoice.customerName}</span>
          <span className="text-muted-foreground">·</span>
          <span className="font-semibold tabular">{formatMoney(invoice.amountDue)}</span>
          {invoice.daysOverdue > 0 && <span className="text-xs text-peach-strong">{invoice.daysOverdue} days overdue</span>}
          {approval.priority === 'high' && <span className="rounded-full bg-primary px-1.5 py-px text-[10.5px] font-semibold text-primary-foreground">High priority</span>}
        </p>
        <p className="mt-1 text-[13px] text-muted-foreground">
          <AiLabel className="mr-1.5">AI suggests</AiLabel>
          <span className="text-foreground">{approval.action.title}</span> — {approval.shortReason}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {reviewRequired ? (
          <Button size="sm" variant="outline" asChild>
            <Link to={`/app/invoices/${invoice.id}`}>
              <ScanSearch /> Investigate
            </Link>
          </Button>
        ) : (
          <>
            <Button size="sm" variant="outline" asChild>
              <Link to={`/app/invoices/${invoice.id}`}>Review</Link>
            </Button>
            <Button size="sm" onClick={() => onOpen('approve', approval)}>
              Approve
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onOpen('reject', approval)}>
              Reject
            </Button>
          </>
        )}
      </div>
    </li>
  )
}

function NeedsAttention() {
  const { data, isLoading, error, refetch } = useApprovals('pending')
  const { open, dialogs } = useApprovalDialogs()
  const items = data?.slice(0, 4) ?? []

  return (
    <Card className="xl:col-span-2">
      <CardHeader className="pb-1">
        <CardTitle>Needs your attention</CardTitle>
        <CardDescription>AI recommendations waiting for a human decision</CardDescription>
        <CardAction>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/app/approvals">
              View all {data ? `(${data.length})` : ''} <ArrowRight />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      {error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : isLoading ? (
        <LoadingRows rows={3} />
      ) : items.length === 0 ? (
        <EmptyState icon={BadgeCheck} title="You're all caught up" description="No AI actions are waiting for approval." />
      ) : (
        <ul className="divide-y">
          {items.map((a) => (
            <AttentionItem key={a.id} approval={a} onOpen={open} />
          ))}
        </ul>
      )}
      {dialogs}
    </Card>
  )
}

const FLOW = [
  { icon: Database, label: 'Accounting data', detail: 'Xero' },
  { icon: Bot, label: 'AI triage', detail: 'Risk scored' },
  { icon: ScanSearch, label: 'Investigation', detail: 'Evidence gathered' },
  { icon: UserCheck, label: 'Human approval', detail: 'You decide' },
  { icon: Zap, label: 'Action', detail: 'Email / re-issue' },
  { icon: CalendarClock, label: 'Payment tracked', detail: 'Follow-up set' },
]

function HowItWorks() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>How CashFlow OS works</CardTitle>
        <CardDescription>Every action is approved by a human before it reaches a customer</CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="space-y-1">
          {FLOW.map((step, i) => {
            const Icon = step.icon
            return (
              <li key={step.label} className="relative flex items-center gap-3 py-1.5">
                {i < FLOW.length - 1 && <span className="absolute left-4 top-9 h-3 w-px bg-border" aria-hidden />}
                <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg', i === 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground/70')}>
                  <Icon className="size-4" aria-hidden />
                </span>
                <span className="flex-1 text-[13px] font-medium">{step.label}</span>
                <span className="text-xs text-muted-foreground">{step.detail}</span>
              </li>
            )
          })}
        </ol>
      </CardContent>
    </Card>
  )
}

export function OverviewPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title={`Good morning, ${currentUser.name.split(' ')[0]}`}
        description={`Here's your receivables position for ${formatDate(calendarToday())}.`}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/app/invoices?filter=overdue">View overdue</Link>
            </Button>
            <Button asChild>
              <Link to="/app/approvals">
                Review approvals <ArrowRight />
              </Link>
            </Button>
          </>
        }
      />
      <Kpis />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <CollectionChart />
        <RiskDistribution />
        <NeedsAttention />
        <HowItWorks />
      </div>
    </div>
  )
}
