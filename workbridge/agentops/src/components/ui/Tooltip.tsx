import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/cn'

type Side = 'top' | 'right' | 'bottom'

interface TooltipProps {
  content: ReactNode
  children: ReactNode
  side?: Side
  className?: string
  disabled?: boolean
}

const OFFSET = 8

export function Tooltip({ content, children, side = 'top', className, disabled }: TooltipProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const timer = useRef<number | undefined>(undefined)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)

  const show = () => {
    if (disabled) return
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      const r = ref.current?.getBoundingClientRect()
      if (!r) return
      if (side === 'right') setPos({ x: r.right + OFFSET, y: r.top + r.height / 2 })
      else if (side === 'bottom') setPos({ x: r.left + r.width / 2, y: r.bottom + OFFSET })
      else setPos({ x: r.left + r.width / 2, y: r.top - OFFSET })
    }, 250)
  }

  const hide = () => {
    window.clearTimeout(timer.current)
    setPos(null)
  }

  const transform =
    side === 'right' ? 'translate(0, -50%)' : side === 'bottom' ? 'translate(-50%, 0)' : 'translate(-50%, -100%)'

  return (
    <span
      ref={ref}
      className={cn('inline-flex', className)}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {pos &&
        createPortal(
          <div
            role="tooltip"
            style={{ left: pos.x, top: pos.y, transform }}
            className="pointer-events-none fixed z-[200] max-w-xs animate-fade-in rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-medium leading-snug text-white shadow-pop"
          >
            {content}
          </div>,
          document.body,
        )}
    </span>
  )
}
