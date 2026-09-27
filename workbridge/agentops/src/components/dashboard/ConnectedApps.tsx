import { useState } from 'react'
import { ExternalLink, Loader2, Plug, Plus, RefreshCw, Search, Unplug, Wrench } from 'lucide-react'
import { cn } from '../../lib/cn'
import { APPS, CATALOG_APPS, serverName } from '../../data/apps'
import type { GatewayTool, ServerId } from '../../data/types'
import type { ServerSummary } from '../../lib/stats'
import type { Integrations } from '../../state/useIntegrations'
import { Panel, PanelHeader } from '../ui/Panel'
import { Button } from '../ui/Button'
import { Dropdown } from '../ui/Dropdown'
import { Modal } from '../ui/Modal'
import { Tooltip } from '../ui/Tooltip'
import { AppIcon } from '../ui/misc'
import { useToast } from '../ui/Toast'

type LiveStatus =
  | { kind: 'loading' }
  | { kind: 'error' }
  | { kind: 'connected'; account?: string | null; url?: string | null }
  | { kind: 'disconnected' }

function liveStatus(integrations: Integrations, id: ServerId): LiveStatus {
  const { state } = integrations
  if (state.phase === 'loading') return { kind: 'loading' }
  if (state.phase === 'error') return { kind: 'error' }
  if (id === 'jira') {
    const j = state.status.jira
    return j.connected ? { kind: 'connected', account: j.siteName, url: j.siteUrl } : { kind: 'disconnected' }
  }
  const s = state.status.slack
  return s.connected ? { kind: 'connected', account: s.teamName } : { kind: 'disconnected' }
}

function StatusPill({ status }: { status: LiveStatus }) {
  const map = {
    loading: { label: 'Checking…', cls: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400 animate-soft-pulse' },
    error: { label: 'Gateway unreachable', cls: 'bg-amber-50 text-amber-800', dot: 'bg-amber-500' },
    connected: { label: 'Connected', cls: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
    disconnected: { label: 'Not connected', cls: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' },
  }[status.kind]
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium', map.cls)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', map.dot)} />
      {map.label}
    </span>
  )
}

function IntegrationCard({
  id,
  integrations,
  tools,
  summary,
  onRequestDisconnect,
}: {
  id: ServerId
  integrations: Integrations
  tools: string[]
  summary: ServerSummary
  onRequestDisconnect: (id: ServerId) => void
}) {
  const toast = useToast()
  const server = { name: serverName(id), tools }
  const app = APPS[id]
  const status = liveStatus(integrations, id)
  const connecting = integrations.connecting === id
  const connected = status.kind === 'connected'

  const connect = async () => {
    const ok = await integrations.connect(id)
    toast(
      ok
        ? { tone: 'success', title: `${app.name} connected`, description: `${server.name} is now exposing ${server.tools.length} tools.` }
        : { tone: 'info', title: `${app.name} connection not completed`, description: 'The authorisation window was closed before finishing.' },
    )
  }

  return (
    <article className={cn('flex flex-col rounded-2xl border p-5 transition-all', connected ? 'border-slate-200/80 hover:border-slate-300 hover:shadow-card' : 'border-dashed border-slate-300')}>
      <div className="flex items-start gap-3">
        <AppIcon app={id} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[15px] font-semibold text-slate-950">{app.name}</h3>
            <StatusPill status={status} />
          </div>
          <p className="mt-0.5 truncate text-xs text-slate-500">
            {status.kind === 'connected' && status.account ? (
              status.url ? (
                <a href={status.url} target="_blank" rel="noreferrer" className="hover:text-slate-800 hover:underline">
                  {status.url.replace(/^https?:\/\//, '')}
                </a>
              ) : (
                <>Workspace · {status.account}</>
              )
            ) : (
              app.category
            )}
          </p>
        </div>

        {status.kind === 'error' ? (
          <Button size="sm" onClick={() => void integrations.refresh()}>
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </Button>
        ) : connected ? (
          <Dropdown
            width={210}
            trigger={({ toggle, open }) => (
              <Button size="sm" onClick={toggle} className={cn(open && 'bg-slate-50')}>
                Manage
              </Button>
            )}
            items={[
              { heading: `${server.name} · ${tools.length} tools` },
              ...(status.kind === 'connected' && status.url
                ? [{ label: `Open ${app.name}`, icon: ExternalLink, onSelect: () => window.open(status.url!, '_blank', 'noopener') }]
                : []),
              {
                label: 'Refresh status',
                icon: RefreshCw,
                onSelect: async () => {
                  await integrations.refresh()
                  toast({ tone: 'success', title: `${app.name} status refreshed` })
                },
              },
              { label: 'Reconnect', icon: Plug, description: 'Re-run OAuth consent', onSelect: () => void connect() },
              'separator',
              { label: 'Disconnect', icon: Unplug, danger: true, onSelect: () => onRequestDisconnect(id) },
            ]}
          />
        ) : (
          <Button size="sm" variant="accent" disabled={connecting || status.kind === 'loading'} onClick={() => void connect()}>
            {connecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plug className="h-3.5 w-3.5" />}
            {connecting ? 'Waiting…' : 'Connect'}
          </Button>
        )}
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-slate-50 px-3 py-2">
          <dt className="text-[11px] text-slate-500">MCP Server</dt>
          <dd className="mt-0.5 truncate text-[13px] font-semibold text-slate-900">{server.name}</dd>
        </div>
        <div className="rounded-xl bg-slate-50 px-3 py-2">
          <dt className="text-[11px] text-slate-500">Available tools</dt>
          <dd className="mt-0.5 text-[13px] font-semibold text-slate-900 tabular">{connected ? server.tools.length : 0}</dd>
        </div>
        <div className="rounded-xl bg-slate-50 px-3 py-2">
          <dt className="text-[11px] text-slate-500">Calls today</dt>
          <dd className="mt-0.5 text-[13px] font-semibold text-slate-900 tabular">{summary.callsToday.toLocaleString('en-GB')}</dd>
        </div>
      </dl>

      <div className="mt-4">
        <p className="mb-1.5 flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-slate-400">
          <Wrench className="h-3 w-3" /> Exposed tools
        </p>
        <div className="flex flex-wrap gap-1.5">
          {server.tools.length === 0 && <span className="text-xs text-slate-400">Start the gateway to list tools</span>}
          {server.tools.map((tool) => (
            <code
              key={tool}
              className={cn(
                'rounded-md px-1.5 py-0.5 font-mono text-[11.5px]',
                connected ? 'bg-blue-50 text-blue-800' : 'bg-slate-100 text-slate-400 line-through',
              )}
            >
              {tool}
            </code>
          ))}
        </div>
      </div>

      <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
        {summary.usedBy.length > 0 ? (
          <>
            Used by <span className="font-medium text-slate-800">{summary.usedBy.join(', ')}</span>
            {summary.p50 != null && <span className="tabular"> · p50 {summary.p50} ms</span>}
          </>
        ) : (
          'No bot has called these tools yet'
        )}
      </p>
    </article>
  )
}

interface ConnectedAppsProps {
  integrations: Integrations
  tools: GatewayTool[]
  summaries: Record<ServerId, ServerSummary>
}

export function ConnectedApps({ integrations, tools, summaries }: ConnectedAppsProps) {
  const toolsFor = (id: ServerId) => tools.filter((t) => t.server === id).map((t) => t.name)
  const toast = useToast()
  const [catalogOpen, setCatalogOpen] = useState(false)
  const [confirming, setConfirming] = useState<ServerId | null>(null)
  const [query, setQuery] = useState('')
  const catalog = CATALOG_APPS.filter((id) => APPS[id].name.toLowerCase().includes(query.toLowerCase()))

  const confirmDisconnect = async () => {
    if (!confirming) return
    const id = confirming
    try {
      await integrations.disconnect(id)
      toast({ tone: 'info', title: `${APPS[id].name} disconnected`, description: `${serverName(id)} tools will fail until you reconnect.` })
    } catch (err) {
      toast({ tone: 'error', title: `Couldn't disconnect ${APPS[id].name}`, description: err instanceof Error ? err.message : undefined })
    } finally {
      setConfirming(null)
    }
  }

  return (
    <Panel>
      <PanelHeader
        title="Connected Applications"
        description="Applications authorised in AgentMesh and exposed to bots as MCP servers."
        actions={
          <Tooltip content="Status is read live from the WorkBridge backend">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
              <span className={cn('h-1.5 w-1.5 rounded-full', integrations.state.phase === 'ready' ? 'bg-emerald-500' : integrations.state.phase === 'error' ? 'bg-amber-500' : 'bg-slate-400')} />
              OAuth backend
            </span>
          </Tooltip>
        }
      />

      <div className="grid grid-cols-1 gap-3 p-5 sm:px-6 lg:grid-cols-[1fr_1fr_minmax(200px,0.6fr)]">
        <IntegrationCard id="jira" integrations={integrations} tools={toolsFor('jira')} summary={summaries.jira} onRequestDisconnect={setConfirming} />
        <IntegrationCard id="slack" integrations={integrations} tools={toolsFor('slack')} summary={summaries.slack} onRequestDisconnect={setConfirming} />
        <button
          type="button"
          onClick={() => setCatalogOpen(true)}
          className="group flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 p-5 text-center transition-colors hover:border-blue-400 hover:bg-blue-50/40"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-colors group-hover:bg-blue-100 group-hover:text-blue-700">
            <Plus className="h-5 w-5" />
          </span>
          <span className="text-[13.5px] font-semibold text-slate-900">Connect Application</span>
          <span className="text-xs text-slate-500">GitHub, Notion, Google Drive, PostgreSQL, Salesforce or your own MCP server</span>
        </button>
      </div>

      <Modal
        open={catalogOpen}
        onClose={() => setCatalogOpen(false)}
        title="Connect an application"
        description="Each application is exposed to bots through its own MCP server. Bots only get the tools you allow."
      >
        <label className="relative mb-4 flex items-center">
          <Search className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search integrations"
            className="h-10 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
          />
        </label>
        <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200">
          {catalog.map((id) => {
            const def = APPS[id]
            return (
              <div key={id} className="flex items-center gap-3 px-4 py-3">
                <AppIcon app={id} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-semibold text-slate-900">{def.name}</p>
                  <p className="text-xs text-slate-500">{def.category}</p>
                </div>
                <span className="hidden items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 sm:inline-flex">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                  Not Connected
                </span>
                <Button
                  size="xs"
                  onClick={() =>
                    toast({
                      tone: 'info',
                      title: `${def.name} isn't available yet`,
                      description: 'The AgentMesh gateway currently exposes Jira and Slack tools only.',
                    })
                  }
                >
                  {id === 'custom' ? 'Configure' : 'Connect'}
                </Button>
              </div>
            )
          })}
          {catalog.length === 0 && <p className="px-4 py-8 text-center text-[13px] text-slate-500">No integrations match “{query}”.</p>}
        </div>
      </Modal>

      <Modal
        open={confirming !== null}
        onClose={() => setConfirming(null)}
        title={confirming ? `Disconnect ${APPS[confirming].name}?` : ''}
        description="This revokes the stored OAuth token in the backend."
        footer={
          <>
            <Button size="md" onClick={() => setConfirming(null)}>
              Cancel
            </Button>
            <Button size="md" variant="destructive" disabled={integrations.disconnecting !== null} onClick={() => void confirmDisconnect()}>
              {integrations.disconnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unplug className="h-4 w-4" />}
              Disconnect
            </Button>
          </>
        }
      >
        {confirming && (
          <p className="text-[13px] leading-relaxed text-slate-600">
            {summaries[confirming].usedBy.length ? summaries[confirming].usedBy.join(' and ') : 'Bots'} will immediately lose access to all{' '}
            {toolsFor(confirming).length} {serverName(confirming)} tools. You can reconnect at any time with a new OAuth consent.
          </p>
        )}
      </Modal>
    </Panel>
  )
}
