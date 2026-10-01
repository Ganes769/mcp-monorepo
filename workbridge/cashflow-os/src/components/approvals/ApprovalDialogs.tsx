import { useState } from 'react'
import { Link } from 'react-router'
import { CheckCircle2, Loader2, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import type { ApprovalWithInvoice } from '@/types'
import { useApproveAction, useRejectAction } from '@/hooks/queries'
import { formatMoney } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RiskBadge } from '@/components/shared/badges'
import { ConfidenceMeter } from '@/components/shared/ai'

export type ApprovalDialogMode = 'approve' | 'edit' | 'reject'

interface DialogState {
  mode: ApprovalDialogMode
  approval: ApprovalWithInvoice
}

function Summary({ approval }: { approval: ApprovalWithInvoice }) {
  const rows = [
    { label: 'Invoice', value: <span className="font-medium">{approval.invoice.invoiceNumber}</span> },
    { label: 'Customer', value: approval.invoice.customerName },
    { label: 'Amount', value: <span className="tabular">{formatMoney(approval.invoice.amountDue, { precise: true })}</span> },
    { label: 'Action', value: <span className="font-medium">{approval.action.title}</span> },
    { label: 'Risk', value: <RiskBadge risk={approval.action.risk} withLabel /> },
    { label: 'Confidence', value: <ConfidenceMeter value={approval.action.confidence} compact /> },
  ]
  return (
    <dl className="divide-y rounded-xl border">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center justify-between gap-4 px-4 py-2.5 text-[13px]">
          <dt className="text-muted-foreground">{row.label}</dt>
          <dd className="text-right">{row.value}</dd>
        </div>
      ))}
    </dl>
  )
}

function ApprovedState({ approval, onClose }: { approval: ApprovalWithInvoice; onClose: () => void }) {
  const steps = ['Human approved action', 'Action executed', 'Follow-up scheduled in 2 days']
  return (
    <>
      <div className="flex flex-col items-center gap-2 pt-2 text-center">
        <span className="flex size-11 items-center justify-center rounded-full bg-lime-soft text-lime-strong">
          <CheckCircle2 className="size-6" aria-hidden />
        </span>
        <DialogTitle>Action approved</DialogTitle>
        <DialogDescription>
          {approval.action.title} for {approval.invoice.invoiceNumber} has been executed (simulated) and recorded in the audit log.
        </DialogDescription>
      </div>
      <ol className="space-y-2 rounded-xl bg-muted/60 p-4">
        {steps.map((step) => (
          <li key={step} className="flex items-center gap-2 text-[13px]">
            <CheckCircle2 className="size-4 text-lime-strong" aria-hidden />
            {step}
          </li>
        ))}
      </ol>
      <DialogFooter>
        <Button variant="outline" asChild>
          <Link to={`/app/invoices/${approval.invoiceId}`} onClick={onClose}>
            View invoice timeline
          </Link>
        </Button>
        <Button onClick={onClose}>Done</Button>
      </DialogFooter>
    </>
  )
}

function ApprovalDialog({ state, onClose }: { state: DialogState; onClose: () => void }) {
  const { approval, mode } = state
  const approve = useApproveAction()
  const reject = useRejectAction()
  const [draft, setDraft] = useState(approval.action.draft)
  const [reason, setReason] = useState('')
  const [approved, setApproved] = useState(false)
  const pending = approve.isPending || reject.isPending

  const onApprove = () =>
    approve.mutate(
      { id: approval.id, draft: mode === 'edit' ? draft : undefined },
      {
        onSuccess: () => {
          setApproved(true)
          toast.success('Action approved', { description: `${approval.invoice.invoiceNumber} · ${approval.action.title}` })
        },
        onError: (err) => toast.error("Couldn't approve action", { description: err.message }),
      },
    )

  const onReject = () =>
    reject.mutate(
      { id: approval.id, reason: reason.trim() },
      {
        onSuccess: () => {
          toast('Action rejected', { description: `${approval.invoice.invoiceNumber} moved to manual review.` })
          onClose()
        },
        onError: (err) => toast.error("Couldn't reject action", { description: err.message }),
      },
    )

  if (approved) return <ApprovedState approval={approval} onClose={onClose} />

  if (mode === 'reject') {
    return (
      <>
        <DialogHeader>
          <DialogTitle>Reject AI action?</DialogTitle>
          <DialogDescription>The action won't be executed and the invoice will move to manual review.</DialogDescription>
        </DialogHeader>
        <Summary approval={approval} />
        <div className="space-y-2">
          <Label htmlFor="reject-reason">Reason (recorded in the audit log)</Label>
          <Textarea id="reject-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. We've already spoken to the customer by phone." />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onReject} disabled={pending}>
            {reject.isPending && <Loader2 className="animate-spin" aria-hidden />}
            Reject action
          </Button>
        </DialogFooter>
      </>
    )
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{mode === 'edit' ? 'Edit and approve action' : 'Approve AI action?'}</DialogTitle>
        <DialogDescription>Review what will be sent before it's executed.</DialogDescription>
      </DialogHeader>
      <Summary approval={approval} />
      {mode === 'edit' ? (
        <div className="space-y-2">
          <Label htmlFor="action-draft">Message / action details</Label>
          <Textarea id="action-draft" value={draft} onChange={(e) => setDraft(e.target.value)} className="min-h-40 font-mono text-[12.5px]" />
        </div>
      ) : (
        <pre className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded-xl border bg-muted/40 p-3 font-sans text-[12.5px] text-foreground/80">{approval.action.draft}</pre>
      )}
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="size-3.5" aria-hidden />
        The action will be recorded in the audit log.
      </p>
      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={pending}>
          Cancel
        </Button>
        <Button onClick={onApprove} disabled={pending || (mode === 'edit' && !draft.trim())}>
          {approve.isPending && <Loader2 className="animate-spin" aria-hidden />}
          {mode === 'edit' ? 'Approve edited action' : 'Approve action'}
        </Button>
      </DialogFooter>
    </>
  )
}

/** Hook that owns approval dialog state; render `dialogs` once and call `open` from any button. */
export function useApprovalDialogs() {
  const [state, setState] = useState<DialogState | null>(null)
  const close = () => setState(null)
  const dialogs = (
    <Dialog open={state !== null} onOpenChange={(open) => !open && close()}>
      <DialogContent className="sm:max-w-md">{state && <ApprovalDialog key={`${state.approval.id}-${state.mode}`} state={state} onClose={close} />}</DialogContent>
    </Dialog>
  )
  return { open: (mode: ApprovalDialogMode, approval: ApprovalWithInvoice) => setState({ mode, approval }), dialogs }
}
