import { Activity, Blocks, ChevronRight, Server, ShieldCheck } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/cn'

interface Step {
  label: string
  detail: string
  icon: LucideIcon
  attention?: boolean
}

export function ValueChain({ apps, tools, bots, blocked }: { apps: number | null; tools: number | null; bots: number | null; blocked: number | null }) {
  const steps: Step[] = [
    { label: 'Connect applications', detail: apps == null ? 'Checking backend…' : `${apps} connected via OAuth`, icon: Blocks },
    { label: 'Expose tools through MCP', detail: tools == null ? 'Gateway offline' : `${tools} tools on the gateway`, icon: Server },
    { label: 'Monitor AI bots', detail: bots == null ? 'Gateway offline' : `${bots} ${bots === 1 ? 'bot' : 'bots'} seen by the gateway`, icon: Activity },
    {
      label: 'Control their actions',
      detail: blocked == null ? 'Gateway offline' : `${blocked} blocked by policy today`,
      icon: ShieldCheck,
      attention: (blocked ?? 0) > 0,
    },
  ]

  return (
    <ol className="grid grid-cols-1 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-card sm:grid-cols-2 xl:grid-cols-4">
      {steps.map((step, i) => {
        const Icon = step.icon
        return (
          <li
            key={step.label}
            className={cn(
              'relative flex items-center gap-3 px-5 py-4',
              i > 0 && 'border-t border-slate-100 sm:border-t-0',
              i % 2 === 1 && 'sm:border-l sm:border-slate-100',
              i === 2 && 'sm:border-t xl:border-t-0 xl:border-l',
              i === 3 && 'sm:border-t xl:border-t-0',
            )}
          >
            <span
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                step.attention ? 'bg-amber-100 text-amber-700' : 'bg-blue-50 text-blue-600',
              )}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
            </span>
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                Step {i + 1}
              </p>
              <p className="truncate text-[13.5px] font-semibold text-slate-900">{step.label}</p>
              <p className={cn('truncate text-xs', step.attention ? 'font-medium text-amber-700' : 'text-slate-500')}>{step.detail}</p>
            </div>
            {i < steps.length - 1 && (
              <ChevronRight className="absolute -right-2.5 top-1/2 z-10 hidden h-5 w-5 -translate-y-1/2 rounded-full bg-white text-slate-300 xl:block" />
            )}
          </li>
        )
      })}
    </ol>
  )
}
