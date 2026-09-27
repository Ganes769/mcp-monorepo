import { AlertTriangle, OctagonX, ShieldCheck } from 'lucide-react'
import { cn } from '../../lib/cn'
import { relativeTime, useNow } from '../../lib/time'
import type { McpCall } from '../../data/types'
import { Panel, PanelHeader } from '../ui/Panel'
import { Button } from '../ui/Button'

const SEVERITY = {
  blocked: { icon: OctagonX, label: 'Blocked by policy', tile: 'bg-amber-100 text-amber-700', text: 'text-amber-800' },
  failed: { icon: AlertTriangle, label: 'Tool call failed', tile: 'bg-red-100 text-red-700', text: 'text-red-700' },
} as const

interface RecentAlertsProps {
  alerts: McpCall[]
  blockedToday: number
  failedToday: number
  onView: (call: McpCall) => void
}

export function RecentAlerts({ alerts, blockedToday, failedToday, onView }: RecentAlertsProps) {
  const now = useNow()

  return (
    <Panel className="flex flex-col">
      <PanelHeader title="Recent Alerts" description="Blocked and failed tool calls from the gateway." />

      {alerts.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-10 text-center">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <p className="text-sm font-medium text-slate-700">No alerts</p>
          <p className="max-w-[260px] text-[13px] text-slate-500">Calls blocked by a bot's tool scopes or rejected by Jira/Slack will show up here.</p>
        </div>
      ) : (
        <ul className="flex-1 divide-y divide-slate-100 px-5 pt-3">
          {alerts.map((call) => {
            if (call.status === 'success') return null
            const s = SEVERITY[call.status]
            const Icon = s.icon
            return (
              <li key={call.id} className="flex items-start gap-3 py-3">
                <span className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', s.tile)}>
                  <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className={cn('text-[11px] font-semibold uppercase tracking-wider', s.text)}>{s.label}</p>
                  <p className="mt-0.5 text-[13px] leading-snug text-slate-900">
                    {call.bot} called{' '}
                    <code className="rounded bg-slate-100 px-1 py-px font-mono text-[11.5px] text-slate-700">{call.tool}</code>
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">
                    {call.error ?? 'No error message'} · <span className="tabular">{relativeTime(call.at, now)}</span>
                  </p>
                </div>
                <Button size="xs" variant="ghost" className="shrink-0" onClick={() => onView(call)}>
                  View
                </Button>
              </li>
            )
          })}
        </ul>
      )}

      <div className="flex items-center gap-4 border-t border-slate-100 px-5 py-3 text-[13px] text-slate-500">
        <span>
          <span className="font-medium text-slate-700 tabular">{blockedToday}</span> blocked today
        </span>
        <span>
          <span className="font-medium text-slate-700 tabular">{failedToday}</span> failed today
        </span>
      </div>
    </Panel>
  )
}
