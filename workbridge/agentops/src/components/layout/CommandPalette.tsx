import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Bot, CornerDownLeft, LayoutGrid, Plug, Search, Wrench } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/cn'
import { serverName } from '../../data/apps'
import type { GatewayTool } from '../../data/types'
import { NAV_LABELS } from './Sidebar'
import type { NavKey } from './Sidebar'
import { Kbd } from '../ui/misc'

interface Command {
  id: string
  label: string
  group: 'Navigate' | 'Bots' | 'MCP Tools'
  icon: LucideIcon
  hint?: string
  run: () => void
}

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
  onNavigate: (key: NavKey) => void
  bots: string[]
  tools: GatewayTool[]
  onConnectBot: () => void
}

export function CommandPalette({ open, onClose, onNavigate, bots: botNames, tools: gatewayTools, onConnectBot }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const commands = useMemo<Command[]>(() => {
    const nav = (Object.keys(NAV_LABELS) as NavKey[]).map((key) => ({
      id: `nav-${key}`,
      label: NAV_LABELS[key],
      group: 'Navigate' as const,
      icon: LayoutGrid,
      run: () => onNavigate(key),
    }))
    nav.unshift({ id: 'connect-bot', label: 'Connect a bot', group: 'Navigate', icon: Plug, run: onConnectBot })
    const bots = botNames.map((name) => ({
      id: `bot-${name}`,
      label: name,
      group: 'Bots' as const,
      icon: Bot,
      run: () => onNavigate('agents'),
    }))
    const tools = gatewayTools.map((tool) => ({
      id: tool.name,
      label: tool.name,
      group: 'MCP Tools' as const,
      icon: Wrench,
      hint: serverName(tool.server),
      run: () => onNavigate('activity'),
    }))
    return [...nav, ...bots, ...tools]
  }, [onNavigate, onConnectBot, botNames, gatewayTools])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? commands.filter((c) => c.label.toLowerCase().includes(q)) : commands.slice(0, 11)
  }, [commands, query])

  useEffect(() => {
    if (open) {
      setQuery('')
      setIndex(0)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  useEffect(() => setIndex(0), [query])

  if (!open) return null

  const execute = (c: Command | undefined) => {
    if (!c) return
    c.run()
    onClose()
  }

  let lastGroup = ''

  return createPortal(
    <div className="fixed inset-0 z-[130] flex items-start justify-center px-4 pt-[12vh]">
      <div className="absolute inset-0 animate-fade-in bg-slate-950/30 backdrop-blur-[2px]" onClick={onClose} />
      <div
        role="dialog"
        aria-label="Command palette"
        className="relative w-full max-w-xl animate-scale-in overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-pop"
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose()
          else if (e.key === 'ArrowDown') {
            e.preventDefault()
            setIndex((i) => Math.min(i + 1, results.length - 1))
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setIndex((i) => Math.max(i - 1, 0))
          } else if (e.key === 'Enter') execute(results[index])
        }}
      >
        <div className="flex items-center gap-3 border-b border-slate-100 px-4">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages, bots, MCP tools…"
            className="h-12 flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          <Kbd>Esc</Kbd>
        </div>
        <div className="scrollbar-thin max-h-[360px] overflow-y-auto p-1.5">
          {results.length === 0 && <p className="py-10 text-center text-[13px] text-slate-500">No results for “{query}”</p>}
          {results.map((c, i) => {
            const showGroup = c.group !== lastGroup
            lastGroup = c.group
            const Icon = c.icon
            return (
              <div key={c.id}>
                {showGroup && <p className="px-2.5 pb-1 pt-2.5 text-[11px] font-medium uppercase tracking-wider text-slate-400">{c.group}</p>}
                <button
                  type="button"
                  onMouseMove={() => setIndex(i)}
                  onClick={() => execute(c)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-[13px]',
                    i === index ? 'bg-slate-100 text-slate-950' : 'text-slate-700',
                  )}
                >
                  <Icon className="h-4 w-4 text-slate-400" strokeWidth={1.85} />
                  <span className={cn('flex-1 truncate', c.group === 'MCP Tools' && 'font-mono text-[12.5px]')}>{c.label}</span>
                  {c.hint && <span className="text-xs text-slate-400">{c.hint}</span>}
                  {i === index && <CornerDownLeft className="h-3.5 w-3.5 text-slate-400" />}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>,
    document.body,
  )
}
