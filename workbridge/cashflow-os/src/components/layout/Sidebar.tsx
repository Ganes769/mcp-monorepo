import { Link, NavLink } from 'react-router'
import { useApprovals } from '@/hooks/queries'
import { useXeroStatus } from '@/hooks/useXero'
import { currentUser } from '@/data/settings'
import { initials } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/misc'
import { APP } from '@/lib/paths'
import { NAV_SECTIONS } from './nav'

export function Logo({ to, className }: { to?: string; className?: string }) {
  const mark = (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="flex size-7 items-end justify-center gap-[3px] rounded-lg bg-primary px-1.5 pb-1.5" aria-hidden>
        <span className="h-2 w-1 rounded-[1px] bg-sun" />
        <span className="h-3 w-1 rounded-[1px] bg-lime" />
        <span className="h-4 w-1 rounded-[1px] bg-peach" />
      </span>
      <span className="text-[15px] font-bold tracking-[-0.02em]">CashFlow OS</span>
    </div>
  )
  return to ? (
    <Link to={to} className="rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
      {mark}
    </Link>
  ) : (
    mark
  )
}

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { data: approvals } = useApprovals('pending')
  const { data: xero } = useXeroStatus()
  const counts = { approvals: approvals?.length ?? 0 }
  const xeroLive = Boolean(xero?.connected && xero.token_valid)

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-5">
        <Logo to="/" />
      </div>

      <nav aria-label="Main" className="scrollbar-thin flex-1 space-y-5 overflow-y-auto px-3 py-2">
        {NAV_SECTIONS.map((section, i) => (
          <div key={section.label ?? i} className="space-y-0.5">
            {section.label && <p className="px-3 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{section.label}</p>}
            {section.items.map((item) => {
              const Icon = item.icon
              const count = item.badge ? counts[item.badge] : 0
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === APP}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      'group flex h-9 items-center gap-2.5 rounded-lg px-3 text-[13.5px] font-medium transition-colors',
                      isActive ? 'bg-muted text-foreground' : 'text-foreground/70 hover:bg-muted/60 hover:text-foreground',
                    )
                  }
                >
                  <Icon className="size-4 shrink-0" aria-hidden />
                  <span className="truncate">{item.label}</span>
                  {count > 0 && (
                    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground tabular" aria-label={`${count} pending`}>
                      {count}
                    </span>
                  )}
                </NavLink>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="space-y-3 p-3">
        <div className="rounded-xl border bg-muted/50 p-3">
          <div className="flex items-center justify-between">
            <p className="text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground">Connected</p>
            <span
              className={cn(
                'inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2 py-px text-[10.5px] font-semibold',
                xeroLive ? 'bg-lime-soft text-lime-strong' : 'bg-sun px-2 text-[#3b3905]',
              )}
            >
              <span className={cn('size-1.5 rounded-full', xeroLive ? 'bg-lime-strong' : 'bg-[#3b3905]')} aria-hidden />
              {xeroLive ? 'Live' : 'Offline'}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-full bg-[#13B5EA] text-[10px] font-bold text-white" aria-hidden>
              xero
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold">Xero</p>
              <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <span className={cn('size-1.5 rounded-full', xeroLive ? 'bg-lime' : 'bg-sun')} aria-hidden />
                {xeroLive ? 'Connected' : 'Not connected'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 rounded-xl px-2 py-1.5">
          <Avatar className="size-8">
            <AvatarFallback className="bg-lime-soft text-lime-strong">{initials(currentUser.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold">{currentUser.name}</p>
            <p className="truncate text-[11px] text-muted-foreground">{currentUser.role}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r bg-sidebar lg:block">
      <SidebarContent />
    </aside>
  )
}
