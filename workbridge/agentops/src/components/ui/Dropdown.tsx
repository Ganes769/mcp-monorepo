import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { LucideIcon } from 'lucide-react'
import { Check } from 'lucide-react'
import { cn } from '../../lib/cn'

export interface DropdownItem {
  label: string
  icon?: LucideIcon
  onSelect?: () => void
  danger?: boolean
  checked?: boolean
  shortcut?: string
  description?: string
}

export type DropdownEntry = DropdownItem | 'separator' | { heading: string }

interface DropdownProps {
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode
  items?: DropdownEntry[]
  children?: ReactNode | ((close: () => void) => ReactNode)
  align?: 'start' | 'end'
  width?: number
  className?: string
}

export function Dropdown({ trigger, items, children, align = 'end', width = 224, className }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const anchorRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })

  const close = useCallback(() => setOpen(false), [])
  const toggle = useCallback(() => setOpen((o) => !o), [])

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return
    const r = anchorRef.current.getBoundingClientRect()
    const left = align === 'end' ? r.right - width : r.left
    setPos({
      top: r.bottom + 6,
      left: Math.max(8, Math.min(left, window.innerWidth - width - 8)),
    })
  }, [open, align, width])

  useEffect(() => {
    if (!open) return
    const onPointer = (e: MouseEvent) => {
      const t = e.target as Node
      if (!menuRef.current?.contains(t) && !anchorRef.current?.contains(t)) close()
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [open, close])

  return (
    <div ref={anchorRef} className={cn('relative inline-flex', className)}>
      {trigger({ open, toggle })}
      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{ top: pos.top, left: pos.left, width }}
            className="fixed z-[150] animate-scale-in overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-pop"
          >
            {typeof children === 'function' ? children(close) : children}
            {items?.map((entry, i) => {
              if (entry === 'separator') return <div key={i} className="my-1 h-px bg-slate-100" />
              if ('heading' in entry)
                return (
                  <div key={i} className="px-2.5 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                    {entry.heading}
                  </div>
                )
              const Icon = entry.icon
              return (
                <button
                  key={i}
                  role="menuitem"
                  type="button"
                  onClick={() => {
                    entry.onSelect?.()
                    close()
                  }}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[13px] transition-colors',
                    entry.danger ? 'text-red-600 hover:bg-red-50' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950',
                  )}
                >
                  {Icon && <Icon className="h-4 w-4 shrink-0 opacity-70" strokeWidth={1.75} />}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{entry.label}</span>
                    {entry.description && <span className="block truncate text-xs text-slate-400">{entry.description}</span>}
                  </span>
                  {entry.shortcut && <kbd className="font-sans text-[11px] text-slate-400">{entry.shortcut}</kbd>}
                  {entry.checked && <Check className="h-4 w-4 text-blue-600" />}
                </button>
              )
            })}
          </div>,
          document.body,
        )}
    </div>
  )
}
