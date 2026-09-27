import { cn } from '../../lib/cn'
import type { CallStatus } from '../../data/types'

const statusStyles: Record<CallStatus, { label: string; className: string; dot: string }> = {
  success: { label: 'Success', className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15', dot: 'bg-emerald-500' },
  blocked: { label: 'Blocked', className: 'bg-amber-50 text-amber-800 ring-amber-600/20', dot: 'bg-amber-500' },
  failed: { label: 'Failed', className: 'bg-red-50 text-red-700 ring-red-600/15', dot: 'bg-red-500' },
}

export function StatusBadge({ status, className }: { status: CallStatus; className?: string }) {
  const s = statusStyles[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        s.className,
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', s.dot)} />
      {s.label}
    </span>
  )
}

export function Pill({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700', className)}>
      {children}
    </span>
  )
}
