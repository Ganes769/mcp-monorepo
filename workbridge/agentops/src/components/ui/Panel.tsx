import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

export function Panel({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={cn('rounded-3xl border border-slate-200/80 bg-white shadow-card', className)}
      {...props}
    />
  )
}

interface PanelHeaderProps {
  title: ReactNode
  description?: ReactNode
  icon?: ReactNode
  actions?: ReactNode
  className?: string
}

export function PanelHeader({ title, description, icon, actions, className }: PanelHeaderProps) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-3 px-5 pt-5 sm:px-6', className)}>
      <div className="flex min-w-0 items-start gap-3">
        {icon}
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-slate-950">{title}</h2>
          {description && <p className="mt-0.5 text-[13px] text-slate-500">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
