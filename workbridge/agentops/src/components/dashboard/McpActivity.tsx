import { useMemo, useState } from 'react'
import { ChevronRight, Loader2, Pause, Play, Plug, Search, SearchX, ServerOff } from 'lucide-react'
import { cn } from '../../lib/cn'
import { clockTime, relativeTime, useNow } from '../../lib/time'
import { appFor, serverName } from '../../data/apps'
import type { CallStatus, McpCall } from '../../data/types'
import type { GatewayConnection } from '../../state/useGateway'
import { Panel, PanelHeader } from '../ui/Panel'
import { Button } from '../ui/Button'
import { StatusBadge } from '../ui/StatusBadge'
import { Tooltip } from '../ui/Tooltip'
import { AppIcon } from '../ui/misc'

type FilterKey = 'all' | CallStatus

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'success', label: 'Success' },
  { key: 'blocked', label: 'Blocked' },
  { key: 'failed', label: 'Failed' },
]

const MAX_ROWS = 12

function durationClass(ms: number): string {
  if (ms >= 3000) return 'text-red-600'
  if (ms >= 1000) return 'text-amber-700'
  return 'text-slate-700'
}

interface McpActivityProps {
  calls: McpCall[]
  connection: GatewayConnection
  live: boolean
  query: string
  onQueryChange: (query: string) => void
  onToggleLive: () => void
  onSelect: (call: McpCall) => void
  onConnectBot: () => void
  onRetry: () => void
}

export function McpActivity({ calls, connection, live, query, onQueryChange, onToggleLive, onSelect, onConnectBot, onRetry }: McpActivityProps) {
  const now = useNow(5000)
  const [filter, setFilter] = useState<FilterKey>('all')

  const searched = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? calls.filter((c) => [c.bot, c.tool, serverName(c.server)].some((v) => v.toLowerCase().includes(q))) : calls
  }, [calls, query])

  const counts = useMemo(
    () => Object.fromEntries(FILTERS.map((f) => [f.key, f.key === 'all' ? searched.length : searched.filter((c) => c.status === f.key).length])),
    [searched],
  )

  const matching = filter === 'all' ? searched : searched.filter((c) => c.status === filter)
  const visible = matching.slice(0, MAX_ROWS)

  return (
    <Panel className="flex flex-col">
      <PanelHeader
        title="Live MCP Activity"
        description="Every tool call routed through the AgentMesh gateway, saved as it happens."
        actions={
          <>
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium',
                connection === 'online' && live ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600',
              )}
            >
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  connection === 'online' && live ? 'animate-soft-pulse bg-emerald-500' : connection === 'offline' ? 'bg-red-500' : 'bg-slate-400',
                )}
              />
              {connection === 'offline' ? 'Gateway offline' : connection === 'connecting' ? 'Connecting…' : live ? 'Streaming' : 'Paused'}
            </span>
            <Tooltip content={live ? 'Pause stream' : 'Resume stream'}>
              <Button size="xs" onClick={onToggleLive} disabled={connection !== 'online'} aria-label={live ? 'Pause stream' : 'Resume stream'}>
                {live ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              </Button>
            </Tooltip>
            <Button size="xs" variant="primary" onClick={onConnectBot}>
              <Plug className="h-3.5 w-3.5" />
              Connect bot
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-3 px-5 pb-3 pt-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="scrollbar-thin -mx-1 flex items-center gap-1 overflow-x-auto px-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={cn(
                'inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 text-[13px] font-medium transition-colors',
                filter === f.key ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
              )}
            >
              {f.label}
              <span className="text-xs text-slate-400 tabular">{counts[f.key]}</span>
            </button>
          ))}
        </div>
        <label className="relative flex items-center">
          <Search className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Filter by bot, server, tool…"
            className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 sm:w-56"
          />
        </label>
      </div>

      <div className="scrollbar-thin overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr className="border-y border-slate-100 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <th className="py-2.5 pl-6 pr-3 font-semibold">Time</th>
              <th className="px-3 py-2.5 font-semibold">Bot</th>
              <th className="px-3 py-2.5 font-semibold">MCP Server</th>
              <th className="px-3 py-2.5 font-semibold">Tool</th>
              <th className="px-3 py-2.5 font-semibold">Status</th>
              <th className="px-3 py-2.5 text-right font-semibold">Duration</th>
              <th className="w-10 py-2.5 pr-4" aria-label="Open" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visible.map((call) => (
              <tr
                key={call.id}
                onClick={() => onSelect(call)}
                className={cn(
                  'group cursor-pointer text-[13px] transition-colors hover:bg-slate-50/80',
                  now - call.at < 8000 && 'animate-row-in',
                  call.status === 'blocked' && 'bg-amber-50/30',
                  call.status === 'failed' && 'bg-red-50/30',
                )}
              >
                <td className="whitespace-nowrap py-3 pl-6 pr-3 text-slate-600">
                  <Tooltip content={relativeTime(call.at, now)}>
                    <span className="cursor-default font-mono text-[12px] tabular">{clockTime(call.at)}</span>
                  </Tooltip>
                </td>
                <td className="whitespace-nowrap px-3 py-3 font-medium text-slate-900">
                  {call.bot}
                  {call.source === 'test' && <span className="ml-1.5 rounded bg-slate-100 px-1 py-px text-[10.5px] font-medium text-slate-500">test</span>}
                </td>
                <td className="whitespace-nowrap px-3 py-3">
                  <span className="flex items-center gap-2 text-slate-700">
                    <AppIcon app={appFor(call.server)} size="xs" />
                    {serverName(call.server)}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-3">
                  <code className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[12px] text-slate-700">{call.tool}</code>
                </td>
                <td className="whitespace-nowrap px-3 py-3">
                  <StatusBadge status={call.status} />
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-right font-mono text-[12px] tabular">
                  {call.status === 'blocked' ? <span className="text-slate-400">—</span> : <span className={durationClass(call.durationMs)}>{call.durationMs.toLocaleString('en-GB')} ms</span>}
                </td>
                <td className="py-3 pr-4 text-right">
                  <ChevronRight className="ml-auto h-4 w-4 text-slate-300 transition-colors group-hover:text-slate-500" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {visible.length === 0 &&
          (connection === 'offline' ? (
            <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
              <ServerOff className="h-6 w-6 text-slate-300" />
              <p className="text-sm font-medium text-slate-700">The AgentMesh gateway isn't running</p>
              <p className="max-w-sm text-[13px] text-slate-500">
                Start it with <code className="rounded bg-slate-100 px-1 font-mono text-[12px]">npm run gateway</code> in the agentops folder. Saved calls will load automatically.
              </p>
              <Button size="xs" className="mt-1" onClick={onRetry}>
                Retry now
              </Button>
            </div>
          ) : connection === 'connecting' ? (
            <div className="flex items-center justify-center gap-2 py-14 text-[13px] text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading saved MCP calls…
            </div>
          ) : calls.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
              <Plug className="h-6 w-6 text-slate-300" />
              <p className="text-sm font-medium text-slate-700">No MCP calls yet</p>
              <p className="max-w-sm text-[13px] text-slate-500">Point a bot at the gateway's MCP URL and every tool call it makes will appear here.</p>
              <Button size="xs" variant="primary" className="mt-1" onClick={onConnectBot}>
                Connect a bot
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
              <SearchX className="h-6 w-6 text-slate-300" />
              <p className="text-sm font-medium text-slate-700">No MCP calls match these filters</p>
              <button
                type="button"
                className="text-[13px] font-medium text-blue-600 hover:text-blue-700"
                onClick={() => {
                  setFilter('all')
                  onQueryChange('')
                }}
              >
                Clear filters
              </button>
            </div>
          ))}
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-slate-100 px-6 py-3 text-[13px] text-slate-500">
        <span className="tabular">
          Showing {visible.length} of {matching.length.toLocaleString('en-GB')} saved calls
        </span>
        <span className="hidden font-mono text-xs text-slate-400 sm:inline">gateway/data/mcp-calls.jsonl</span>
      </div>
    </Panel>
  )
}
