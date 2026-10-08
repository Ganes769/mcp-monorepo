import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Bell, BookOpen, CircleHelp, LifeBuoy, LogOut, Menu, Settings, UserRound } from 'lucide-react'
import { useMarkNotificationsRead, useNotifications } from '@/hooks/queries'
import { useAuth } from '@/auth/AuthProvider'
import { currentUser } from '@/data/settings'
import { formatDateTime, initials } from '@/lib/format'
import { appPath, LOGIN } from '@/lib/paths'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/misc'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { XeroLiveBadge } from '@/components/xero/XeroLiveBadge'
import { GlobalSearch } from './GlobalSearch'
import { SidebarContent } from './Sidebar'

function NotificationsMenu() {
  const navigate = useNavigate()
  const { data: notifications = [] } = useNotifications()
  const markRead = useMarkNotificationsRead()
  const unread = notifications.filter((n) => n.unread).length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative" aria-label={`Notifications, ${unread} unread`}>
          <Bell />
          {unread > 0 && <span className="absolute right-2 top-2 size-2 rounded-full bg-peach ring-2 ring-card" aria-hidden />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-1.5">
          <p className="text-[13px] font-semibold">Notifications</p>
          {unread > 0 && (
            <button type="button" className="text-xs font-medium text-muted-foreground hover:text-foreground" onClick={() => markRead.mutate(undefined)}>
              Mark all read
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        {notifications.map((n) => (
          <DropdownMenuItem
            key={n.id}
            className="items-start py-2"
            onSelect={() => {
              markRead.mutate([n.id])
              navigate(n.href)
            }}
          >
            <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', n.unread ? 'bg-peach' : 'bg-bar')} aria-hidden />
            <span className="min-w-0 flex-1">
              <span className={cn('block text-[13px]', n.unread ? 'font-semibold' : 'font-medium text-foreground/70')}>{n.title}</span>
              <span className="block text-xs text-muted-foreground">{n.body}</span>
              <span className="mt-0.5 block text-[11px] text-muted-foreground">{formatDateTime(n.at)}</span>
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function Topbar() {
  const [mobileNav, setMobileNav] = useState(false)
  const { logout } = useAuth()
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-20 border-b bg-background/85 backdrop-blur">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileNav(true)} aria-label="Open navigation">
          <Menu />
        </Button>
        <GlobalSearch />
        <div className="ml-auto flex items-center gap-2">
          <XeroLiveBadge compact />
          <NotificationsMenu />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Help">
                <CircleHelp />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Help</DropdownMenuLabel>
              <DropdownMenuItem>
                <BookOpen /> How the AI agent works
              </DropdownMenuItem>
              <DropdownMenuItem>
                <LifeBuoy /> Contact support
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="flex items-center gap-2.5 rounded-lg border bg-card py-1 pl-1 pr-3 shadow-xs hover:bg-accent" aria-label="Account menu">
                <Avatar className="size-7">
                  <AvatarFallback className="bg-lime-soft text-[11px] text-lime-strong">{initials(currentUser.name)}</AvatarFallback>
                </Avatar>
                <span className="hidden text-left leading-tight md:block">
                  <span className="block text-[12.5px] font-semibold">{currentUser.name}</span>
                  <span className="block text-[11px] text-muted-foreground">{currentUser.email}</span>
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>{currentUser.role}</DropdownMenuLabel>
              <DropdownMenuItem>
                <UserRound /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={appPath('/settings')}>
                  <Settings /> Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => {
                  logout()
                  navigate(LOGIN)
                }}
              >
                <LogOut /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Sheet open={mobileNav} onOpenChange={setMobileNav}>
        <SheetContent>
          <SheetTitle>Navigation</SheetTitle>
          <SidebarContent onNavigate={() => setMobileNav(false)} />
        </SheetContent>
      </Sheet>
    </header>
  )
}
