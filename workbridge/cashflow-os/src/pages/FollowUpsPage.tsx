import { useState } from 'react'
import { Link } from 'react-router'
import { CalendarClock, CheckCircle2, Clock, MoreHorizontal, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import type { FollowUpStatus } from '@/types'
import { useFollowUps, useUpdateFollowUp } from '@/hooks/queries'
import { FOLLOW_UP_STATUS } from '@/lib/labels'
import { formatDate, formatMoney, relativeDay } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader } from '@/components/shared/PageHeader'
import { FollowUpStatusBadge } from '@/components/shared/badges'
import { EmptyState, ErrorState, LoadingRows } from '@/components/shared/states'

type View = 'all' | FollowUpStatus
const VIEWS: View[] = ['all', 'scheduled', 'waiting', 'completed', 'cancelled']

export function FollowUpsPage() {
  const [view, setView] = useState<View>('all')
  const { data, isLoading, error, refetch } = useFollowUps()
  const update = useUpdateFollowUp()
  const rows = (data ?? []).filter((f) => view === 'all' || f.status === view)
  const count = (v: View) => (data ?? []).filter((f) => v === 'all' || f.status === v).length

  const setStatus = (id: string, status: FollowUpStatus) =>
    update.mutate(
      { id, status },
      {
        onSuccess: () => toast.success(`Follow-up marked ${FOLLOW_UP_STATUS[status].label.toLowerCase()}`),
        onError: (err) => toast.error("Couldn't update follow-up", { description: err.message }),
      },
    )

  return (
    <div className="space-y-5">
      <PageHeader title="Follow-ups" description="Checks the agent will run later, such as whether a customer has paid after a reminder." />
      <Tabs value={view} onValueChange={(v) => setView(v as View)}>
        <TabsList className="flex-wrap">
          {VIEWS.map((v) => (
            <TabsTrigger key={v} value={v}>
              {v === 'all' ? 'All' : FOLLOW_UP_STATUS[v].label} <span className="tabular text-muted-foreground">{count(v)}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card className="overflow-hidden">
        {error ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : isLoading ? (
          <LoadingRows rows={6} />
        ) : rows.length === 0 ? (
          <EmptyState icon={CalendarClock} title="No follow-ups here" description="Follow-ups are created automatically when you approve an AI action." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Due</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Follow-up</TableHead>
                <TableHead>Why</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((f) => {
                const open = f.status === 'scheduled' || f.status === 'waiting'
                return (
                  <TableRow key={f.id}>
                    <TableCell>
                      <span className="block font-medium">{formatDate(f.dueAt)}</span>
                      <span className="text-[11px] text-muted-foreground">{relativeDay(f.dueAt)}</span>
                    </TableCell>
                    <TableCell className="font-semibold">
                      <Link to={`/app/invoices/${f.invoiceId}`} className="hover:underline">
                        {f.invoiceNumber}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link to={`/app/customers/${f.customerId}`} className="hover:underline">
                        {f.customerName}
                      </Link>
                    </TableCell>
                    <TableCell className="font-medium">{f.action}</TableCell>
                    <TableCell className="max-w-72 whitespace-normal text-[12.5px] text-muted-foreground">{f.reason}</TableCell>
                    <TableCell className="text-right tabular">{formatMoney(f.amountDue)}</TableCell>
                    <TableCell>
                      <FollowUpStatusBadge status={f.status} />
                    </TableCell>
                    <TableCell>
                      {open && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm" aria-label={`Actions for follow-up on ${f.invoiceNumber}`}>
                              <MoreHorizontal />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => setStatus(f.id, 'completed')}>
                              <CheckCircle2 /> Mark completed
                            </DropdownMenuItem>
                            {f.status === 'scheduled' && (
                              <DropdownMenuItem onSelect={() => setStatus(f.id, 'waiting')}>
                                <Clock /> Mark waiting on customer
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem variant="destructive" onSelect={() => setStatus(f.id, 'cancelled')}>
                              <XCircle /> Cancel follow-up
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  )
}
