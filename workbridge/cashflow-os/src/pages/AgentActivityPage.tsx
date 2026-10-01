import { useState } from 'react'
import { Link } from 'react-router'
import type { LucideIcon } from 'lucide-react'
import { Activity, AlertTriangle, CheckCircle2, Clock, GitBranch, Hand, Play, Wrench, Zap } from 'lucide-react'
import type { AgentEventKind, AgentRunStatus } from '@/types'
import { useAgentActivity } from '@/hooks/queries'
import { useWebhookEvents } from '@/hooks/useXero'
import { formatDuration, formatTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState, ErrorState, LoadingRows } from '@/components/shared/states'

const EVENT: Record<AgentEventKind, { icon: LucideIcon; label: string; className: string }> = {
  tool_call: { icon: Wrench, label: 'Tool call', className: 'bg-muted text-foreground/70' },
  decision: { icon: GitBranch, label: 'Decision', className: 'bg-sun-soft text-sun-strong' },
  action: { icon: Zap, label: 'Action', className: 'bg-primary text-primary-foreground' },
  approval: { icon: Hand, label: 'Approval', className: 'bg-peach-soft text-peach-strong' },
  error: { icon: AlertTriangle, label: 'Error', className: 'bg-coral-soft text-coral' },
  success: { icon: CheckCircle2, label: 'Success', className: 'bg-lime-soft text-lime-strong' },
}

const RUN_STATUS: Record<AgentRunStatus, { label: string; variant: 'sun' | 'peach' | 'lime' | 'coral' }> = {
  running: { label: 'Running', variant: 'sun' },
  waiting: { label: 'Waiting for human', variant: 'peach' },
  succeeded: { label: 'Succeeded', variant: 'lime' },
  failed: { label: 'Failed', variant: 'coral' },
}

type KindFilter = 'all' | AgentEventKind

function StatCard({ label, value, icon: Icon, className }: { label: string; value: number; icon: LucideIcon; className: string }) {
  return (
    <Card className="gap-3 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className={cn('flex size-7 items-center justify-center rounded-lg', className)}>
          <Icon className="size-3.5" aria-hidden />
        </span>
      </div>
      <p className="text-[26px] font-semibold leading-none tabular">{value}</p>
    </Card>
  )
}

export function AgentActivityPage() {
  const [kind, setKind] = useState<KindFilter>('all')
  const { data, isLoading, error, refetch } = useAgentActivity()
  const webhooks = useWebhookEvents(50)
  const events = (data?.events ?? []).filter((e) => kind === 'all' || e.kind === kind)

  if (error) return <ErrorState error={error} onRetry={() => refetch()} />

  return (
    <div className="space-y-5">
      <PageHeader title="Agent Activity" description="Xero webhook events from the cash-flow API, plus the collections agent feed." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Runs today" value={data?.stats.runsToday ?? 0} icon={Play} className="bg-muted text-foreground/70" />
        <StatCard label="Successful" value={data?.stats.successful ?? 0} icon={CheckCircle2} className="bg-lime-soft text-lime-strong" />
        <StatCard label="Waiting for human" value={data?.stats.waiting ?? 0} icon={Clock} className="bg-peach-soft text-peach-strong" />
        <StatCard label="Xero webhook events" value={webhooks.data?.count ?? 0} icon={Activity} className="bg-muted text-foreground/70" />
      </div>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Xero webhooks</CardTitle>
          <CardDescription>{webhooks.data?.count ?? 0} events stored from Xero</CardDescription>
        </CardHeader>
        {webhooks.error ? (
          <ErrorState error={webhooks.error} onRetry={() => webhooks.refetch()} />
        ) : webhooks.isLoading ? (
          <LoadingRows rows={4} />
        ) : !webhooks.data?.events.length ? (
          <EmptyState icon={Activity} title="No webhook events yet" description="Xero posts invoice and contact changes to the API. They will show up here." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>When</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {webhooks.data.events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{event.created_at?.slice(0, 19).replace('T', ' ') ?? '—'}</TableCell>
                  <TableCell className="font-medium">{event.event_category}</TableCell>
                  <TableCell>{event.event_type}</TableCell>
                  <TableCell className="font-mono text-xs">{event.resource_id}</TableCell>
                  <TableCell>
                    {event.error ? (
                      <Badge variant="coral">Failed</Badge>
                    ) : event.processed ? (
                      <Badge variant="lime">Processed</Badge>
                    ) : (
                      <Badge variant="sun">Pending</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Event feed</CardTitle>
            <CardDescription>Newest first · updates live</CardDescription>
          </CardHeader>
          <div className="scrollbar-thin flex gap-1.5 overflow-x-auto px-5 pt-3" role="group" aria-label="Filter events">
            {(['all', ...Object.keys(EVENT)] as KindFilter[]).map((k) => (
              <button
                key={k}
                type="button"
                aria-pressed={kind === k}
                onClick={() => setKind(k)}
                className={cn('h-7 shrink-0 rounded-full border px-2.5 text-xs font-medium', kind === k ? 'border-primary bg-primary text-primary-foreground' : 'bg-card text-foreground/75 hover:bg-muted')}
              >
                {k === 'all' ? 'All' : EVENT[k].label}
              </button>
            ))}
          </div>
          <CardContent>
            {isLoading ? (
              <LoadingRows rows={8} className="p-0" />
            ) : events.length === 0 ? (
              <EmptyState icon={Activity} title="No events" />
            ) : (
              <ol className="scrollbar-thin max-h-[640px] overflow-y-auto pr-1" aria-live="polite">
                {events.map((e, i) => {
                  const meta = EVENT[e.kind]
                  const Icon = meta.icon
                  return (
                    <li key={e.id} className="relative flex gap-3 pb-4 last:pb-0">
                      {i < events.length - 1 && <span className="absolute bottom-0 left-[13px] top-8 w-px bg-border" aria-hidden />}
                      <span className={cn('z-[1] flex size-7 shrink-0 items-center justify-center rounded-full ring-4 ring-card', meta.className)} title={meta.label}>
                        <Icon className="size-3.5" aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1 pt-0.5">
                        <div className="flex items-baseline justify-between gap-3">
                          <p className="text-[13px] font-medium">
                            <span className="sr-only">{meta.label}: </span>
                            {e.title}
                          </p>
                          <time className="shrink-0 font-mono text-[11px] text-muted-foreground">{formatTime(e.at)}</time>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {e.invoiceNumber && (
                            <Link to={`/app/invoices/${e.invoiceNumber.toLowerCase()}`} className="font-medium text-foreground/80 hover:underline">
                              {e.invoiceNumber}
                            </Link>
                          )}
                          {e.tool && <span className="font-mono text-[11px]"> · {e.tool}()</span>}
                          {e.detail && ` · ${e.detail}`}
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ol>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle>Recent runs</CardTitle>
            <CardDescription>One run per investigation</CardDescription>
          </CardHeader>
          {isLoading ? (
            <LoadingRows rows={8} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Started</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Summary</TableHead>
                  <TableHead className="text-right">Tools</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.runs.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell className="font-mono text-xs">
                      {formatTime(run.startedAt)}
                      <span className="block text-[11px] text-muted-foreground">{formatDuration(run.durationSeconds)}</span>
                    </TableCell>
                    <TableCell>
                      <Link to={`/app/invoices/${run.invoiceId}`} className="font-semibold hover:underline">
                        {run.invoiceNumber}
                      </Link>
                      <p className="text-[11px] text-muted-foreground">{run.customerName}</p>
                    </TableCell>
                    <TableCell className="min-w-44 whitespace-normal text-[12.5px]">{run.summary}</TableCell>
                    <TableCell className="text-right tabular">{run.toolCalls}</TableCell>
                    <TableCell>
                      <Badge variant={RUN_STATUS[run.status].variant}>{RUN_STATUS[run.status].label}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  )
}
