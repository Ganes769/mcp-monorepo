import { Activity, ArrowDownRight, ArrowRight, ArrowUpRight, Blocks, Bot, ShieldAlert } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { Sparkline } from '../ui/misc'
import { Tooltip } from '../ui/Tooltip'

interface KpiCardProps {
  label: string
  value: ReactNode
  icon: LucideIcon
  footer: ReactNode
  chart?: ReactNode
  highlight?: boolean
  onClick?: () => void
  hint: string
}

function KpiCard({ label, value, icon: Icon, footer, chart, highlight, onClick, hint }: KpiCardProps) {
  const Wrapper = onClick ? 'button' : 'div'
  return (
    <Wrapper
      {...(onClick ? { type: 'button' as const, onClick } : {})}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-3xl border bg-white p-5 text-left shadow-card transition-all duration-200',
        highlight
          ? 'border-amber-300/80 ring-4 ring-amber-100/70 hover:border-amber-400'
          : 'border-slate-200/80 hover:border-slate-300',
      )}
    >
      {highlight && <span className="absolute inset-x-0 top-0 h-0.5 bg-amber-400" />}
      <div className="flex items-center justify-between">
        <Tooltip content={hint}>
          <span className="cursor-default text-[13px] font-medium text-slate-500 underline decoration-slate-300 decoration-dotted underline-offset-4">
            {label}
          </span>
        </Tooltip>
        <span
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-xl',
            highlight ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600',
          )}
        >
          <Icon className="h-4 w-4" strokeWidth={1.9} />
        </span>
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <span className="text-[32px] font-bold leading-none tracking-[-0.04em] text-slate-950 tabular">{value}</span>
        {chart}
      </div>
      <div className="mt-3 text-[13px] text-slate-500">{footer}</div>
    </Wrapper>
  )
}

function DayOverDay({ today, yesterday }: { today: number; yesterday: number }) {
  if (yesterday === 0) return <span>{today === 0 ? 'No calls recorded yet today' : 'First day with recorded calls'}</span>
  const change = Math.round(((today - yesterday) / yesterday) * 1000) / 10
  const up = change >= 0
  return (
    <span className="flex items-center gap-2">
      <span
        className={cn(
          'inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-semibold tabular',
          up ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600',
        )}
      >
        {up ? <ArrowUpRight className="h-3 w-3" strokeWidth={2.5} /> : <ArrowDownRight className="h-3 w-3" strokeWidth={2.5} />}
        {Math.abs(change)}%
      </span>
      vs {yesterday.toLocaleString('en-GB')} yesterday
    </span>
  )
}

interface KpiCardsProps {
  connectedApps: string[] | null
  activeBots: number | null
  runningBots: number
  callsToday: number | null
  callsYesterday: number
  trend: number[]
  blocked: number
  failed: number
  onReview: () => void
}

export function KpiCards({ connectedApps, activeBots, runningBots, callsToday, callsYesterday, trend, blocked, failed, onReview }: KpiCardsProps) {
  const held = blocked + failed
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        label="Connected Apps"
        hint="Applications authorised via OAuth in the WorkBridge backend and exposed through MCP"
        value={connectedApps ? connectedApps.length : '—'}
        icon={Blocks}
        chart={
          connectedApps && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Live
            </span>
          )
        }
        footer={<span>{connectedApps ? connectedApps.join(', ') || 'None connected' : 'Checking backend…'}</span>}
      />
      <KpiCard
        label="Active Bots"
        hint="Bots that called a tool through the gateway in the last 24 hours and aren't paused"
        value={activeBots ?? '—'}
        icon={Bot}
        chart={
          runningBots > 0 && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-blue-700">
              <span className="h-1.5 w-1.5 animate-soft-pulse rounded-full bg-blue-500" />
              {runningBots} running
            </span>
          )
        }
        footer={<span>{runningBots > 0 ? `${runningBots} called a tool in the last 5 min` : 'None calling tools right now'}</span>}
      />
      <KpiCard
        label="MCP Calls Today"
        hint="Tool calls saved by the AgentMesh gateway since midnight"
        value={callsToday != null ? callsToday.toLocaleString('en-GB') : '—'}
        icon={Activity}
        chart={trend.some(Boolean) && <Sparkline data={trend} width={84} height={30} stroke="#2563EB" />}
        footer={callsToday != null ? <DayOverDay today={callsToday} yesterday={callsYesterday} /> : <span>Gateway offline</span>}
      />
      <KpiCard
        label="Blocked / Failed"
        hint="Tool calls stopped by bot policy, or that errored in Jira/Slack, today"
        value={callsToday != null ? held : '—'}
        icon={ShieldAlert}
        highlight={held > 0}
        onClick={held > 0 ? onReview : undefined}
        footer={
          held > 0 ? (
            <span className="flex items-center gap-1 font-medium text-amber-800">
              {blocked} blocked · {failed} failed
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          ) : (
            <span>Nothing blocked or failed today</span>
          )
        }
      />
    </div>
  )
}
