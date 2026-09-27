import {
  Activity,
  Bot,
  ChevronsUpDown,
  CircleHelp,
  LayoutGrid,
  LogOut,
  ScrollText,
  Settings,
  ShieldCheck,
  Blocks,
  UserRound,
  CheckSquare,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/cn'
import { useMediaQuery } from '../../lib/useMediaQuery'
import { Tooltip } from '../ui/Tooltip'
import { Dropdown } from '../ui/Dropdown'
import { Avatar } from '../ui/misc'

export type NavKey =
  | 'dashboard'
  | 'agents'
  | 'applications'
  | 'activity'
  | 'policies'
  | 'approvals'
  | 'audit'
  | 'settings'

interface NavItem {
  key: NavKey
  label: string
  icon: LucideIcon
  count?: number
}

interface SidebarProps {
  active: NavKey
  onNavigate: (key: NavKey) => void
  mobileOpen: boolean
  onCloseMobile: () => void
}

export const NAV_LABELS: Record<NavKey, string> = {
  dashboard: 'Dashboard',
  agents: 'Agents',
  applications: 'Applications',
  activity: 'MCP Activity',
  policies: 'Policies',
  approvals: 'Approvals',
  audit: 'Audit Logs',
  settings: 'Settings',
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="relative flex h-8 w-8 items-center justify-center rounded-[10px] bg-slate-950 shadow-sm">
        <svg viewBox="0 0 32 32" className="h-5 w-5" aria-hidden>
          <path d="M8 9 16 16 24 9M8 23l8-7 8 7" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="8" cy="9" r="2.4" fill="#fff" />
          <circle cx="24" cy="9" r="2.4" fill="#fff" />
          <circle cx="8" cy="23" r="2.4" fill="#fff" />
          <circle cx="24" cy="23" r="2.4" fill="#fff" />
          <circle cx="16" cy="16" r="3.2" fill="#3B82F6" />
        </svg>
      </span>
      {!compact && <span className="text-[15px] font-semibold tracking-[-0.02em] text-slate-950">AgentMesh</span>}
    </div>
  )
}

function NavButton({
  item,
  active,
  onClick,
}: {
  item: NavItem
  active: boolean
  onClick: () => void
}) {
  const Icon = item.icon
  const isRail = useMediaQuery('(min-width: 768px) and (max-width: 1023.98px)')
  return (
    <Tooltip content={item.label} side="right" className="w-full md:max-lg:justify-center" disabled={!isRail}>
      <button
        type="button"
        onClick={onClick}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'group relative flex h-9 w-full items-center gap-3 rounded-xl px-3 text-[13.5px] font-medium transition-colors md:max-lg:w-10 md:max-lg:justify-center md:max-lg:px-0',
          active
            ? 'bg-white text-slate-950 shadow-card ring-1 ring-slate-200/80'
            : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-950',
        )}
      >
        <Icon
          className={cn('h-[18px] w-[18px] shrink-0', active ? 'text-blue-600' : 'text-slate-500 group-hover:text-slate-700')}
          strokeWidth={1.85}
        />
        <span className="truncate md:max-lg:hidden">{item.label}</span>
        {item.count ? (
          <span
            className={cn(
              'ml-auto rounded-full bg-amber-100 px-1.5 text-[11px] font-semibold leading-5 text-amber-800 tabular',
              'md:max-lg:absolute md:max-lg:-right-1 md:max-lg:-top-1 md:max-lg:ml-0 md:max-lg:min-w-[18px] md:max-lg:px-1 md:max-lg:text-center md:max-lg:leading-[18px]',
            )}
          >
            {item.count}
          </span>
        ) : null}
      </button>
    </Tooltip>
  )
}

export function Sidebar({ active, onNavigate, mobileOpen, onCloseMobile }: SidebarProps) {
  const primary: NavItem[] = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { key: 'agents', label: 'Agents', icon: Bot },
    { key: 'applications', label: 'Applications', icon: Blocks },
    { key: 'activity', label: 'MCP Activity', icon: Activity },
  ]
  const governance: NavItem[] = [
    { key: 'policies', label: 'Policies', icon: ShieldCheck },
    { key: 'approvals', label: 'Approvals', icon: CheckSquare },
    { key: 'audit', label: 'Audit Logs', icon: ScrollText },
  ]
  const footer: NavItem[] = [{ key: 'settings', label: 'Settings', icon: Settings }]

  const go = (key: NavKey) => {
    onNavigate(key)
    onCloseMobile()
  }

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 animate-fade-in bg-slate-950/30 md:hidden" onClick={onCloseMobile} />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200/80 bg-[#F8F9FA] transition-transform duration-200',
          'md:w-[72px] md:translate-x-0 lg:w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center px-5 md:max-lg:justify-center md:max-lg:px-0">
          <span className="md:max-lg:hidden">
            <Logo />
          </span>
          <span className="hidden md:max-lg:block">
            <Logo compact />
          </span>
        </div>

        <nav className="scrollbar-thin flex-1 space-y-6 overflow-y-auto px-3 pb-4 pt-2 md:max-lg:flex md:max-lg:flex-col md:max-lg:items-center md:max-lg:px-0">
          <div className="space-y-0.5 md:max-lg:flex md:max-lg:flex-col md:max-lg:items-center">
            <p className="mb-1.5 px-3 text-[11px] font-medium uppercase tracking-wider text-slate-400 md:max-lg:hidden">Platform</p>
            {primary.map((item) => (
              <NavButton key={item.key} item={item} active={active === item.key} onClick={() => go(item.key)} />
            ))}
          </div>
          <div className="space-y-0.5 md:max-lg:flex md:max-lg:flex-col md:max-lg:items-center">
            <p className="mb-1.5 px-3 text-[11px] font-medium uppercase tracking-wider text-slate-400 md:max-lg:hidden">Governance</p>
            {governance.map((item) => (
              <NavButton key={item.key} item={item} active={active === item.key} onClick={() => go(item.key)} />
            ))}
          </div>
        </nav>

        <div className="space-y-0.5 border-t border-slate-200/80 px-3 py-3 md:max-lg:flex md:max-lg:flex-col md:max-lg:items-center md:max-lg:px-0">
          {footer.map((item) => (
            <NavButton key={item.key} item={item} active={active === item.key} onClick={() => go(item.key)} />
          ))}
        </div>

        <div className="border-t border-slate-200/80 p-3 md:max-lg:flex md:max-lg:justify-center">
          <Dropdown
            align="start"
            width={232}
            className="w-full md:max-lg:w-auto"
            trigger={({ toggle, open }) => (
              <button
                type="button"
                onClick={toggle}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-slate-200/50',
                  open && 'bg-slate-200/50',
                  'md:max-lg:w-auto',
                )}
              >
                <Avatar name="Ganesh" size={32} />
                <span className="min-w-0 flex-1 md:max-lg:hidden">
                  <span className="block truncate text-[13px] font-semibold text-slate-900">Ganesh</span>
                  <span className="block truncate text-xs text-slate-500">Workspace owner</span>
                </span>
                <ChevronsUpDown className="h-4 w-4 text-slate-400 md:max-lg:hidden" />
              </button>
            )}
            items={[
              { heading: 'Ganesh' },
              { label: 'Profile', icon: UserRound, onSelect: () => go('settings') },
              { label: 'Workspace settings', icon: Settings, onSelect: () => go('settings') },
              { label: 'Documentation', icon: CircleHelp },
              'separator',
              { label: 'Sign out', icon: LogOut, danger: true },
            ]}
          />
        </div>
      </aside>
    </>
  )
}
