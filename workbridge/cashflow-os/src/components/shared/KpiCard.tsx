import type { LucideIcon } from 'lucide-react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/misc'
import { cn } from '@/lib/utils'

export interface KpiTrend {
  label: string
  direction: 'up' | 'down'
  /** Whether this direction is good news (e.g. overdue days going down is positive) */
  positive: boolean
}

interface KpiCardProps {
  label: string
  value: ReactNode
  subtitle: ReactNode
  icon: LucideIcon
  trend?: KpiTrend
  highlight?: boolean
  loading?: boolean
}

export function KpiCard({ label, value, subtitle, icon: Icon, trend, highlight, loading }: KpiCardProps) {
  return (
    <Card className={cn('gap-3 p-4', highlight && 'border-peach/70 bg-peach-soft/40')}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className={cn('flex size-7 items-center justify-center rounded-lg', highlight ? 'bg-peach-soft text-peach-strong' : 'bg-muted text-foreground/70')}>
          <Icon className="size-3.5" aria-hidden />
        </span>
      </div>
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-3.5 w-36" />
        </div>
      ) : (
        <div>
          <p className="text-[26px] font-semibold leading-none tracking-[-0.03em] tabular">{value}</p>
          <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            {trend && (
              <span className={cn('inline-flex items-center gap-0.5 font-semibold tabular', trend.positive ? 'text-lime-strong' : 'text-peach-strong')}>
                {trend.direction === 'up' ? <ArrowUpRight className="size-3.5" aria-hidden /> : <ArrowDownRight className="size-3.5" aria-hidden />}
                {trend.label}
              </span>
            )}
            {subtitle}
          </p>
        </div>
      )}
    </Card>
  )
}
