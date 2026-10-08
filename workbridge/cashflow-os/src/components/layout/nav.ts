import type { LucideIcon } from 'lucide-react'
import { Activity, BarChart3, CalendarClock, ClipboardCheck, FileText, LayoutGrid, Link2, ScanSearch, Settings, Users } from 'lucide-react'
import { APP } from '@/lib/paths'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  badge?: 'approvals'
}

export const NAV_SECTIONS: Array<{ label?: string; items: NavItem[] }> = [
  {
    items: [
      { to: APP, label: 'Overview', icon: LayoutGrid },
      { to: `${APP}/contacts`, label: 'Contacts', icon: Users },
      { to: `${APP}/invoices`, label: 'Invoices', icon: FileText },
      { to: `${APP}/xero`, label: 'Xero', icon: Link2 },
    ],
  },
  {
    label: 'Collections',
    items: [
      { to: `${APP}/investigations`, label: 'AI Investigations', icon: ScanSearch },
      { to: `${APP}/approvals`, label: 'Approvals', icon: ClipboardCheck, badge: 'approvals' },
      { to: `${APP}/follow-ups`, label: 'Follow-ups', icon: CalendarClock },
    ],
  },
  {
    label: 'Insights',
    items: [
      { to: `${APP}/agent-activity`, label: 'Agent Activity', icon: Activity },
      { to: `${APP}/analytics`, label: 'Analytics', icon: BarChart3 },
      { to: `${APP}/settings`, label: 'Settings', icon: Settings },
    ],
  },
]
