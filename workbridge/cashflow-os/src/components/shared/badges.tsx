import type { AIStatus, FollowUpStatus, InvoiceStatus, RiskLevel } from '@/types'
import { AI_STATUS, FOLLOW_UP_STATUS, INVOICE_STATUS, RISK } from '@/lib/labels'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

export function InvoiceStatusBadge({ status, className }: { status: InvoiceStatus; className?: string }) {
  const meta = INVOICE_STATUS[status]
  return (
    <Badge variant={meta.tone} className={className}>
      {meta.label}
    </Badge>
  )
}

export function AiStatusBadge({ status, className }: { status: AIStatus; className?: string }) {
  const meta = AI_STATUS[status]
  return (
    <Badge variant={meta.tone} className={className}>
      {status === 'investigating' && <Loader2 className="animate-spin" aria-hidden />}
      {meta.label}
    </Badge>
  )
}

export function RiskBadge({ risk, className, withLabel = false }: { risk: RiskLevel; className?: string; withLabel?: boolean }) {
  const meta = RISK[risk]
  return (
    <Badge variant="outline" className={cn('gap-1.5 font-medium', className)}>
      <span className={cn('size-1.5 rounded-full', meta.dot)} aria-hidden />
      {meta.label}
      {withLabel && ' risk'}
    </Badge>
  )
}

export function FollowUpStatusBadge({ status }: { status: FollowUpStatus }) {
  const meta = FOLLOW_UP_STATUS[status]
  return <Badge variant={meta.tone}>{meta.label}</Badge>
}
