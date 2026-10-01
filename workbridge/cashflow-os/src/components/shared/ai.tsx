import type { ReactNode } from 'react'
import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Marks content as an AI hypothesis so it's never mistaken for confirmed fact. */
export function AiLabel({ children = 'AI finding', className }: { children?: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-lime-strong', className)}>
      <Sparkles className="size-3" aria-hidden />
      {children}
    </span>
  )
}

export function ConfidenceMeter({ value, className, compact = false }: { value: number; className?: string; compact?: boolean }) {
  const tone = value >= 85 ? 'bg-lime' : value >= 70 ? 'bg-sun' : 'bg-peach'
  return (
    <div className={cn('flex items-center gap-2', className)} aria-label={`Confidence ${value}%`}>
      {!compact && <span className="text-xs text-muted-foreground">Confidence</span>}
      <span className="flex gap-0.5" aria-hidden>
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className={cn('h-3 w-1.5 rounded-[2px]', i < Math.round(value / 10) ? tone : 'bg-bar')} />
        ))}
      </span>
      <span className="text-xs font-semibold tabular">{value}%</span>
    </div>
  )
}
