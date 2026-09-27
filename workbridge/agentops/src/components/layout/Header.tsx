import { useState } from 'react'
import { Bell, Building2, ChevronDown, LogOut, Menu, Search, Settings, UserRound } from 'lucide-react'
import { cn } from '../../lib/cn'
import { relativeTime, useNow } from '../../lib/time'
import type { McpCall } from '../../data/types'
import { Dropdown } from '../ui/Dropdown'
import { IconButton } from '../ui/Button'
import { Tooltip } from '../ui/Tooltip'
import { Avatar, Kbd } from '../ui/misc'

const WORKSPACE = 'Ganesh Workspace'

interface HeaderProps {
  title: string
  subtitle: string
  onOpenMobileNav: () => void
  onOpenSearch: () => void
  alerts: McpCall[]
}

export function Header({ title, subtitle, onOpenMobileNav, onOpenSearch, alerts }: HeaderProps) {
  const now = useNow(30_000)
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set())
  const unread = alerts.filter((a) => !readIds.has(a.id)).length
  const markRead = (ids: string[]) => setReadIds((prev) => new Set([...prev, ...ids]))

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-canvas/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <IconButton className="md:hidden" onClick={onOpenMobileNav} aria-label="Open navigation">
          <Menu className="h-5 w-5" />
        </IconButton>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold tracking-[-0.03em] text-slate-950 sm:text-xl">{title}</h1>
          <p className="hidden truncate text-[13px] text-slate-500 sm:block">{subtitle}</p>
        </div>

        <button
          type="button"
          onClick={onOpenSearch}
          className="hidden h-9 w-64 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-[13px] text-slate-400 shadow-sm transition-colors hover:border-slate-300 xl:flex"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="flex-1 truncate whitespace-nowrap text-left">Search bots, MCP tools…</span>
          <Kbd>⌘K</Kbd>
        </button>

        <Dropdown
          width={264}
          trigger={({ toggle, open }) => (
            <button
              type="button"
              onClick={toggle}
              className={cn(
                'flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white pl-1.5 pr-2.5 text-[13px] font-medium text-slate-800 shadow-sm transition-colors hover:border-slate-300',
                open && 'border-slate-300 bg-slate-50',
              )}
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-600 text-[11px] font-bold text-white">
                {WORKSPACE[0]}
              </span>
              <span className="hidden max-w-[140px] truncate sm:inline">{WORKSPACE}</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>
          )}
          items={[
            { heading: 'Workspace' },
            { label: WORKSPACE, description: 'workspace#default in WorkBridge', icon: Building2, checked: true },
          ]}
        />

        <Dropdown
          width={340}
          trigger={({ toggle, open }) => (
            <Tooltip content="Notifications" side="bottom">
              <IconButton
                onClick={toggle}
                aria-label={`Notifications (${unread} unread)`}
                className={cn('relative h-9 w-9 rounded-xl border border-slate-200 bg-white shadow-sm', open && 'bg-slate-50')}
              >
                <Bell className="h-[18px] w-[18px]" strokeWidth={1.85} />
                {unread > 0 && (
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white" />
                )}
              </IconButton>
            </Tooltip>
          )}
        >
          <div className="flex items-center justify-between px-2.5 pb-2 pt-1.5">
            <p className="text-[13px] font-semibold text-slate-900">Notifications</p>
            <button
              type="button"
              className="text-xs font-medium text-blue-600 hover:text-blue-700"
              onClick={() => markRead(alerts.map((a) => a.id))}
            >
              Mark all as read
            </button>
          </div>
          <div className="space-y-0.5">
            {alerts.length === 0 && <p className="px-2.5 py-6 text-center text-[13px] text-slate-500">No blocked or failed MCP calls.</p>}
            {alerts.map((a) => {
              const isUnread = !readIds.has(a.id)
              return (
                <button
                  type="button"
                  key={a.id}
                  onClick={() => markRead([a.id])}
                  className="flex w-full items-start gap-3 rounded-lg px-2.5 py-2 text-left hover:bg-slate-50"
                >
                  <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', a.status === 'blocked' ? 'bg-amber-500' : 'bg-red-500', !isUnread && 'opacity-30')} />
                  <span className="min-w-0 flex-1">
                    <span className={cn('block text-[13px]', isUnread ? 'font-semibold text-slate-900' : 'font-medium text-slate-600')}>
                      {a.status === 'blocked' ? 'Tool call blocked' : 'Tool call failed'}
                    </span>
                    <span className="line-clamp-2 block text-xs leading-snug text-slate-500">
                      {a.bot} · {a.tool} — {a.error}
                    </span>
                  </span>
                  <span className="shrink-0 text-[11px] text-slate-400 tabular">{relativeTime(a.at, now)}</span>
                </button>
              )
            })}
          </div>
        </Dropdown>

        <Dropdown
          width={232}
          trigger={({ toggle }) => (
            <button type="button" onClick={toggle} className="flex items-center gap-1 rounded-full" aria-label="Account menu">
              <Avatar name="Ganesh" size={34} />
              <ChevronDown className="hidden h-3.5 w-3.5 text-slate-400 sm:block" />
            </button>
          )}
          items={[
            { heading: 'Signed in as Ganesh' },
            { label: 'Profile', icon: UserRound },
            { label: 'Settings', icon: Settings },
            'separator',
            { label: 'Sign out', icon: LogOut, danger: true },
          ]}
        />
      </div>
    </header>
  )
}
