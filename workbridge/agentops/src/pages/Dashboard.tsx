import { useEffect, useMemo, useRef, useState } from 'react'
import type { McpCall, ServerId } from '../data/types'
import { APPS, SERVER_IDS } from '../data/apps'
import { alertsFrom, summarizeBots, summarizeServer, summarizeToday } from '../lib/stats'
import type { BotSummary } from '../lib/stats'
import { useNow } from '../lib/time'
import type { Gateway } from '../state/useGateway'
import { useIntegrations } from '../state/useIntegrations'
import { ValueChain } from '../components/dashboard/ValueChain'
import { KpiCards } from '../components/dashboard/KpiCards'
import { McpActivity } from '../components/dashboard/McpActivity'
import { McpFlow } from '../components/dashboard/McpFlow'
import { RecentAlerts } from '../components/dashboard/RecentAlerts'
import { ConnectedApps } from '../components/dashboard/ConnectedApps'
import { BotsOverview } from '../components/dashboard/BotsOverview'
import { CallDetailsModal } from '../components/dashboard/CallDetailsModal'
import { ConnectBotModal } from '../components/dashboard/ConnectBotModal'
import { useToast } from '../components/ui/Toast'

interface DashboardProps {
  gateway: Gateway
  connectOpen: boolean
  onConnectOpenChange: (open: boolean) => void
}

export function Dashboard({ gateway, connectOpen, onConnectOpenChange }: DashboardProps) {
  const toast = useToast()
  const integrations = useIntegrations()
  const now = useNow(15_000)
  const [viewing, setViewing] = useState<McpCall | null>(null)
  const [frozen, setFrozen] = useState<McpCall[] | null>(null)
  const [query, setQuery] = useState('')
  const activityRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (integrations.state.phase === 'error') {
      toast({ tone: 'error', title: "Couldn't reach the OAuth backend", description: integrations.state.message })
    }
  }, [integrations.state, toast])

  const online = gateway.connection === 'online'
  const { calls } = gateway

  const connectedApps = useMemo(() => {
    if (integrations.state.phase !== 'ready') return null
    const { jira, slack } = integrations.state.status
    return [jira.connected && APPS.jira.name, slack.connected && APPS.slack.name].filter(Boolean) as string[]
  }, [integrations.state])
  const projectKey = integrations.state.phase === 'ready' ? integrations.state.status.projectKey : undefined

  const today = useMemo(() => summarizeToday(calls, now), [calls, now])
  const bots = useMemo(() => summarizeBots(calls, gateway.botConfigs, now), [calls, gateway.botConfigs, now])
  const alerts = useMemo(() => alertsFrom(calls), [calls])
  const servers = useMemo(
    () => Object.fromEntries(SERVER_IDS.map((id) => [id, summarizeServer(calls, id, now)])) as Record<ServerId, ReturnType<typeof summarizeServer>>,
    [calls, now],
  )

  const activeBots = bots.filter((b) => b.status === 'active').length
  const runningBots = bots.filter((b) => b.running).length

  const viewLogs = (bot: BotSummary) => {
    setQuery(bot.name)
    activityRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const toggleBot = async (bot: BotSummary) => {
    try {
      await gateway.setPaused(bot.name, !bot.paused)
      toast({
        tone: bot.paused ? 'success' : 'info',
        title: bot.paused ? `${bot.name} resumed` : `${bot.name} paused`,
        description: bot.paused ? 'Its tool calls are allowed again.' : 'The gateway will block its tool calls until resumed.',
      })
    } catch (err) {
      toast({ tone: 'error', title: `Couldn't update ${bot.name}`, description: err instanceof Error ? err.message : undefined })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-[13px]">
        <span
          className={
            online
              ? 'inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-1 font-medium text-blue-700'
              : 'inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 font-medium text-red-700'
          }
        >
          <span className={online ? 'h-1.5 w-1.5 animate-soft-pulse rounded-full bg-blue-600' : 'h-1.5 w-1.5 rounded-full bg-red-500'} />
          {online ? 'Gateway online' : gateway.connection === 'offline' ? 'Gateway offline' : 'Connecting to gateway…'}
        </span>
        {gateway.health && <span className="hidden font-mono text-xs text-slate-500 sm:inline">{gateway.health.mcpUrl}</span>}
      </div>

      <ValueChain
        apps={connectedApps?.length ?? null}
        tools={online ? gateway.tools.length : null}
        bots={online ? bots.length : null}
        blocked={online ? today.blocked : null}
      />

      <KpiCards
        connectedApps={connectedApps}
        activeBots={online ? activeBots : null}
        runningBots={runningBots}
        callsToday={online ? today.calls : null}
        callsYesterday={today.yesterday}
        trend={today.trend}
        blocked={today.blocked}
        failed={today.failed}
        onReview={() => alerts[0] && setViewing(alerts[0])}
      />

      {/* Below 2xl the column wrappers use `display: contents` so their cards re-flow via `order` */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="contents 2xl:col-span-8 2xl:block 2xl:min-w-0 2xl:space-y-4">
          <div ref={activityRef} className="order-1 min-w-0 scroll-mt-24 xl:col-span-12">
            <McpActivity
              calls={frozen ?? calls}
              connection={gateway.connection}
              live={frozen === null}
              query={query}
              onQueryChange={setQuery}
              onToggleLive={() => setFrozen((f) => (f ? null : calls))}
              onSelect={setViewing}
              onConnectBot={() => onConnectOpenChange(true)}
              onRetry={gateway.reconnect}
            />
          </div>
          <div className="order-4 min-w-0 xl:col-span-12">
            <ConnectedApps integrations={integrations} tools={gateway.tools} summaries={servers} />
          </div>
        </div>
        <div className="contents 2xl:col-span-4 2xl:block 2xl:min-w-0 2xl:space-y-4">
          <div className="order-2 flex min-w-0 flex-col xl:col-span-6 [&>*]:flex-1">
            <McpFlow
              connection={gateway.connection}
              health={gateway.health}
              tools={gateway.tools}
              botNames={bots.map((b) => b.name)}
              registeredBots={gateway.botConfigs.length}
              pausedBots={gateway.botConfigs.filter((b) => b.paused).length}
              defaultPolicy={gateway.defaultPolicy}
              perMinute={today.perMinute}
              blockedToday={today.blocked}
              successRate={today.successRate}
              p50={today.p50}
            />
          </div>
          <div className="order-3 flex min-w-0 flex-col xl:col-span-6 [&>*]:flex-1">
            <RecentAlerts alerts={alerts} blockedToday={today.blocked} failedToday={today.failed} onView={setViewing} />
          </div>
        </div>
      </div>

      <BotsOverview bots={bots} onToggle={(b) => void toggleBot(b)} onViewLogs={viewLogs} onConnectBot={() => onConnectOpenChange(true)} />

      <CallDetailsModal call={viewing} onClose={() => setViewing(null)} />
      <ConnectBotModal
        open={connectOpen}
        onClose={() => onConnectOpenChange(false)}
        connection={gateway.connection}
        health={gateway.health}
        tools={gateway.tools}
        bots={gateway.botConfigs}
        projectKey={projectKey}
        onTestCall={gateway.testCall}
        onViewCall={(call) => {
          onConnectOpenChange(false)
          setViewing(call)
        }}
      />
    </div>
  )
}
