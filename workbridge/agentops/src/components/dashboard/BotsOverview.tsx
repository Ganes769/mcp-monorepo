import { Activity, Bot as BotIcon, CheckCircle2, MoreHorizontal, Pause, Play, ScrollText } from 'lucide-react'
import { cn } from '../../lib/cn'
import { relativeTime, useNow } from '../../lib/time'
import type { BotSummary } from '../../lib/stats'
import { appFor, serverName } from '../../data/apps'
import { Panel, PanelHeader } from '../ui/Panel'
import { Button, IconButton } from '../ui/Button'
import { Dropdown } from '../ui/Dropdown'
import { Tooltip } from '../ui/Tooltip'
import { AppIcon, Sparkline } from '../ui/misc'

const STATUS = {
  active: { label: 'Active', cls: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
  idle: { label: 'Idle', cls: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' },
  paused: { label: 'Paused', cls: 'bg-amber-50 text-amber-800', dot: 'bg-amber-500' },
} as const

interface BotsOverviewProps {
  bots: BotSummary[]
  onToggle: (bot: BotSummary) => void
  onViewLogs: (bot: BotSummary) => void
  onConnectBot: () => void
}

export function BotsOverview({ bots, onToggle, onViewLogs, onConnectBot }: BotsOverviewProps) {
  const now = useNow(15_000)

  return (
    <Panel>
      <PanelHeader
        title="Active AI Bots"
        description="Bots registered in gateway/bots.json or seen calling tools, and how they're behaving."
        actions={
          <Button size="sm" onClick={onConnectBot}>
            Connect a bot
          </Button>
        }
      />
      {bots.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
          <BotIcon className="h-6 w-6 text-slate-300" />
          <p className="text-sm font-medium text-slate-700">No bots yet</p>
          <p className="max-w-sm text-[13px] text-slate-500">Bots appear here once they're registered in gateway/bots.json or make their first MCP call.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 p-5 sm:px-6 md:grid-cols-2 xl:grid-cols-3">
          {bots.map((bot) => {
            const s = STATUS[bot.status]
            return (
              <article key={bot.name} className="group flex flex-col rounded-2xl border border-slate-200/80 p-4 transition-all hover:border-slate-300 hover:shadow-card">
                <div className="flex items-start gap-3">
                  <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white">
                    <BotIcon className="h-5 w-5" strokeWidth={1.75} />
                    {bot.running && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-soft-pulse rounded-full bg-blue-500 ring-2 ring-white" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-sm font-semibold text-slate-950">{bot.name}</h3>
                      <span className={cn('inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-px text-[11px] font-medium', s.cls)}>
                        <span className={cn('h-1.5 w-1.5 rounded-full', s.dot)} />
                        {s.label}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {bot.running ? 'Running now · ' : ''}
                      {bot.lastSeen ? `Last call ${relativeTime(bot.lastSeen, now)}` : 'No calls yet'}
                      {!bot.registered && ' · not in bots.json'}
                    </p>
                  </div>
                  <Dropdown
                    width={196}
                    trigger={({ toggle }) => (
                      <IconButton onClick={toggle} aria-label={`${bot.name} actions`} className="-mr-1.5 -mt-1 h-7 w-7">
                        <MoreHorizontal className="h-4 w-4" />
                      </IconButton>
                    )}
                    items={[
                      ...(bot.registered
                        ? [{ label: bot.paused ? 'Resume bot' : 'Pause bot', icon: bot.paused ? Play : Pause, onSelect: () => onToggle(bot) }]
                        : []),
                      { label: 'View MCP logs', icon: ScrollText, onSelect: () => onViewLogs(bot) },
                    ]}
                  />
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 text-xs">
                  <span className="shrink-0 text-slate-500">{bot.scopes ? 'Tool scopes' : 'Apps used'}</span>
                  <span className="flex flex-wrap justify-end gap-1.5">
                    {bot.scopes?.map((scope) => (
                      <code key={scope} className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-700">
                        {scope}
                      </code>
                    ))}
                    {!bot.scopes &&
                      bot.servers.map((id) => (
                        <Tooltip key={id} content={serverName(id)}>
                          <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 py-0.5 pl-0.5 pr-1.5 font-medium capitalize text-slate-700">
                            <AppIcon app={appFor(id)} size="xs" />
                            {id}
                          </span>
                        </Tooltip>
                      ))}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-slate-50 px-2.5 py-2">
                    <p className="flex items-center gap-1 text-[11px] text-slate-500">
                      <Activity className="h-3 w-3" /> MCP calls today
                    </p>
                    <p className="mt-0.5 text-[13px] font-semibold text-slate-900 tabular">
                      {bot.callsToday.toLocaleString('en-GB')}
                      {bot.blockedToday > 0 && <span className="ml-1 font-medium text-amber-700">· {bot.blockedToday} blocked</span>}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-2.5 py-2">
                    <p className="flex items-center gap-1 text-[11px] text-slate-500">
                      <CheckCircle2 className="h-3 w-3" /> Success rate
                    </p>
                    <p className="mt-0.5 text-[13px] font-semibold text-slate-900 tabular">{bot.successRate != null ? `${bot.successRate}%` : '—'}</p>
                  </div>
                </div>

                <div className="mt-4 flex items-end justify-between gap-3">
                  <p className="text-xs text-slate-500">Calls / hour, last 12h</p>
                  {bot.trend.some(Boolean) ? (
                    <Sparkline data={bot.trend} width={96} height={28} stroke={bot.status === 'active' ? '#2563EB' : '#94A3B8'} />
                  ) : (
                    <span className="text-xs text-slate-400">No activity</span>
                  )}
                </div>

                <Button size="sm" className="mt-4 w-full" onClick={() => onViewLogs(bot)}>
                  View MCP logs
                </Button>
              </article>
            )
          })}
        </div>
      )}
    </Panel>
  )
}
