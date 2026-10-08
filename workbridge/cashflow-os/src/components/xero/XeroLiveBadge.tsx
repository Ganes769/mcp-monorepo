import { RefreshCw } from 'lucide-react'
import { isXeroConnected } from '@/api/auth'
import { useXeroStatus, useXeroSync } from '@/hooks/useXero'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export function XeroLiveBadge({ className, compact = false }: { className?: string; compact?: boolean }) {
  const { data } = useXeroStatus()
  const live = isXeroConnected(data)
  const finished = data?.last_sync?.finished_at

  return (
    <span className={cn('inline-flex items-center gap-2 text-[12px]', className)}>
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold',
          live ? 'bg-lime-soft text-lime-strong' : 'bg-muted text-muted-foreground',
        )}
      >
        <span className={cn('size-1.5 rounded-full', live ? 'bg-lime-strong' : 'bg-muted-foreground')} aria-hidden />
        {live ? 'Live' : 'Offline'}
      </span>
      {!compact && finished ? <span className="hidden text-muted-foreground sm:inline">Last synced {formatDateTime(finished)}</span> : null}
    </span>
  )
}

export function SyncNowButton({ className }: { className?: string }) {
  const sync = useXeroSync()
  const { data } = useXeroStatus()
  const live = isXeroConnected(data)

  return (
    <Button
      size="sm"
      variant="outline"
      className={className}
      disabled={!live || sync.isPending}
      onClick={() => sync.mutate()}
    >
      <RefreshCw className={cn(sync.isPending && 'animate-spin')} aria-hidden />
      {sync.isPending ? 'Syncing…' : 'Sync now'}
    </Button>
  )
}
