import { Link, useNavigate } from 'react-router'
import { Loader2, ScanSearch } from 'lucide-react'
import type { Investigation } from '@/types'
import { useInvestigations } from '@/hooks/queries'
import { AGENT_STAGES, LATE_REASON } from '@/lib/labels'
import { formatDateTime, formatDuration, formatMoney } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageHeader } from '@/components/shared/PageHeader'
import { AiStatusBadge } from '@/components/shared/badges'
import { ConfidenceMeter } from '@/components/shared/ai'
import { EmptyState, ErrorState, LoadingRows } from '@/components/shared/states'

const stageLabel = (stage: Investigation['stage']) => AGENT_STAGES.find((s) => s.key === stage)?.label ?? stage

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <Card className="flex-row items-center gap-3 p-4">
      <span className={`size-2.5 rounded-full ${tone}`} aria-hidden />
      <span className="text-[13px] text-muted-foreground">{label}</span>
      <span className="ml-auto text-xl font-semibold tabular">{value}</span>
    </Card>
  )
}

export function InvestigationsPage() {
  const navigate = useNavigate()
  const { data, isLoading, error, refetch } = useInvestigations()
  const running = data?.filter((i) => i.state === 'running').length ?? 0
  const awaiting = data?.filter((i) => i.state === 'completed' && i.stage === 'human_approval').length ?? 0
  const monitoring = data?.filter((i) => i.stage === 'verify_payment').length ?? 0

  return (
    <div className="space-y-5">
      <PageHeader title="AI Investigations" description="What the agent checked on each invoice, what it thinks is going on, and how sure it is." />

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="In progress" value={running} tone="bg-sun" />
        <Stat label="Waiting for a human" value={awaiting} tone="bg-peach" />
        <Stat label="Monitoring payment" value={monitoring} tone="bg-lime" />
      </div>

      <Card className="overflow-hidden">
        {error ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : isLoading ? (
          <LoadingRows rows={8} />
        ) : !data?.length ? (
          <EmptyState icon={ScanSearch} title="No investigations yet" description="Open an overdue invoice and start an investigation." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Invoice</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>AI-identified likely reason</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>Invoice AI status</TableHead>
                <TableHead>Started</TableHead>
                <TableHead className="text-right">Elapsed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.invoiceId} className="cursor-pointer" onClick={() => navigate(`/app/invoices/${row.invoiceId}`)}>
                  <TableCell className="font-semibold">
                    <Link to={`/app/invoices/${row.invoiceId}`} className="hover:underline" onClick={(e) => e.stopPropagation()}>
                      {row.invoice.invoiceNumber}
                    </Link>
                  </TableCell>
                  <TableCell>{row.invoice.customerName}</TableCell>
                  <TableCell className="text-right tabular">{formatMoney(row.invoice.amountDue)}</TableCell>
                  <TableCell>
                    {row.state === 'running' ? (
                      <Badge variant="sun">
                        <Loader2 className="animate-spin" aria-hidden /> {row.live ? row.currentStep : 'Queued to resume'}
                      </Badge>
                    ) : (
                      <Badge variant="outline">{stageLabel(row.stage)}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{row.state === 'completed' ? LATE_REASON[row.likelyReason] : '—'}</TableCell>
                  <TableCell>{row.confidence !== null ? <ConfidenceMeter value={row.confidence} compact /> : <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell>
                    <AiStatusBadge status={row.invoice.aiStatus} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDateTime(row.startedAt)}</TableCell>
                  <TableCell className="text-right tabular">{formatDuration(row.elapsedSeconds)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  )
}
