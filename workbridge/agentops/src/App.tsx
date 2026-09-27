import { useCallback, useEffect, useMemo, useState } from 'react'
import { Sidebar, NAV_LABELS } from './components/layout/Sidebar'
import type { NavKey } from './components/layout/Sidebar'
import { Header } from './components/layout/Header'
import { CommandPalette } from './components/layout/CommandPalette'
import { ToastProvider } from './components/ui/Toast'
import { Dashboard } from './pages/Dashboard'
import { Placeholder } from './pages/Placeholder'
import { useGateway } from './state/useGateway'
import { alertsFrom } from './lib/stats'

const SUBTITLES: Record<NavKey, string> = {
  dashboard: 'Monitor MCP traffic, AI bots and tool calls across your connected applications.',
  agents: 'AI bots, their gateway tokens and tool scopes.',
  applications: 'Applications exposed to bots as MCP servers.',
  activity: 'Every MCP tool call routed through the gateway.',
  policies: 'Rules that decide which tool calls are allowed, held or blocked.',
  approvals: 'Human-in-the-loop decisions for sensitive tool calls.',
  audit: 'Immutable record of every action in this workspace.',
  settings: 'Workspace, gateway and notification preferences.',
}

function Shell() {
  const gateway = useGateway()
  const [active, setActive] = useState<NavKey>('dashboard')
  const [mobileNav, setMobileNav] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [connectOpen, setConnectOpen] = useState(false)
  const alerts = useMemo(() => alertsFrom(gateway.calls, 8), [gateway.calls])
  const botNames = useMemo(
    () => [...new Set([...gateway.botConfigs.map((b) => b.name), ...gateway.calls.map((c) => c.bot)])],
    [gateway.botConfigs, gateway.calls],
  )

  const navigate = useCallback((key: NavKey) => {
    setActive(key)
    window.scrollTo({ top: 0 })
  }, [])

  useEffect(() => {
    document.title = `${NAV_LABELS[active]} · AgentMesh`
  }, [active])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="relative min-h-screen bg-canvas">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.08),_transparent_35%)]"
      />
      <Sidebar
        active={active}
        onNavigate={navigate}
        mobileOpen={mobileNav}
        onCloseMobile={() => setMobileNav(false)}
      />
      <div className="relative md:pl-[72px] lg:pl-64">
        <Header
          title={NAV_LABELS[active]}
          subtitle={SUBTITLES[active]}
          onOpenMobileNav={() => setMobileNav(true)}
          onOpenSearch={() => setPaletteOpen(true)}
          alerts={alerts}
        />
        <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
          {active === 'dashboard' ? (
            <Dashboard gateway={gateway} connectOpen={connectOpen} onConnectOpenChange={setConnectOpen} />
          ) : (
            <Placeholder title={NAV_LABELS[active]} onBack={() => navigate('dashboard')} />
          )}
        </main>
      </div>
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onNavigate={navigate}
        bots={botNames}
        tools={gateway.tools}
        onConnectBot={() => {
          navigate('dashboard')
          setConnectOpen(true)
        }}
      />
    </div>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <Shell />
    </ToastProvider>
  )
}
