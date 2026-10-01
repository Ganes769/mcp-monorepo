import { CheckCircle2, Pencil, Send, ShieldAlert, X, XCircle } from 'lucide-react'
import type { Approval } from '@/types'
import type { ApprovalDialogMode } from '@/components/approvals/ApprovalDialogs'
import { formatDateTime } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { RiskBadge } from '@/components/shared/badges'
import { AiLabel, ConfidenceMeter } from '@/components/shared/ai'

export function RecommendedActionCard({ approval, onOpen }: { approval: Approval; onOpen: (mode: ApprovalDialogMode) => void }) {
  const { action } = approval

  if (approval.status === 'approved') {
    return (
      <Card className="flex-row items-start gap-3 border-lime bg-lime-soft/60 p-5">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-lime-strong" aria-hidden />
        <div>
          <p className="text-[15px] font-semibold">Action approved and executed</p>
          <p className="mt-1 text-[13px] text-foreground/75">
            {action.title} — approved by {approval.decidedBy ?? 'a team member'}
            {approval.decidedAt && ` on ${formatDateTime(approval.decidedAt)}`}. The agent is now monitoring for payment and a follow-up is scheduled.
          </p>
        </div>
      </Card>
    )
  }

  if (approval.status === 'rejected') {
    return (
      <Card className="flex-row items-start gap-3 p-5">
        <XCircle className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
        <div>
          <p className="text-[15px] font-semibold">Recommendation rejected</p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {action.title} was rejected by {approval.decidedBy ?? 'a team member'}
            {approval.note && `: “${approval.note}”`}. Re-run the investigation for a new recommendation.
          </p>
        </div>
      </Card>
    )
  }

  const reviewRequired = action.approvalMode === 'review_required'

  return (
    <Card className="overflow-hidden border-primary/80 shadow-sm">
      <div className="flex items-center justify-between gap-3 bg-primary px-5 py-2.5 text-primary-foreground">
        <p className="text-xs font-semibold uppercase tracking-wider">Recommended next action</p>
        <span className="text-[11px] text-primary-foreground/70">Nothing is sent until you approve</span>
      </div>
      <div className="space-y-4 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <AiLabel>AI suggestion</AiLabel>
            <h3 className="mt-1.5 text-lg font-semibold tracking-[-0.01em]">{action.title}</h3>
            <p className="mt-1 text-[13px] text-muted-foreground">{action.reason}</p>
          </div>
          <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
            <RiskBadge risk={action.risk} withLabel />
            <ConfidenceMeter value={action.confidence} compact />
          </div>
        </div>

        <div className="rounded-lg border bg-muted/40">
          <p className="border-b px-3 py-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Draft</p>
          <pre className="max-h-52 overflow-y-auto whitespace-pre-wrap px-3 py-2.5 font-sans text-[13px] leading-relaxed text-foreground/85">{action.draft}</pre>
        </div>

        {reviewRequired ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 text-[13px] text-[#9a2f25]">
              <ShieldAlert className="size-4 shrink-0" aria-hidden />
              Policy: disputes need a person to handle them. The agent won't contact the customer.
            </p>
            <Button variant="outline" onClick={() => onOpen('reject')}>
              <X /> Dismiss recommendation
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button size="lg" onClick={() => onOpen('approve')}>
              <Send /> Approve &amp; send
            </Button>
            <Button size="lg" variant="outline" onClick={() => onOpen('edit')}>
              <Pencil /> Edit action
            </Button>
            <Button size="lg" variant="ghost" onClick={() => onOpen('reject')}>
              <X /> Reject
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
