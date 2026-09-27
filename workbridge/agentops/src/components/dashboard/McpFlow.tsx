import { useState } from 'react'
import { Bot, Cpu, Network, ShieldCheck } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/cn'
import type { GatewayConnection } from '../../state/useGateway'
import type { GatewayHealth, GatewayTool } from '../../data/types'
import { Panel, PanelHeader } from '../ui/Panel'
import { AppIcon } from '../ui/misc'

type NodeId = 'bot' | 'gateway' | 'policy' | 'servers' | 'exec'

interface FlowNode {
  id: NodeId
  title: string
  subtitle: string
  icon?: LucideIcon
  details: Array<{ label: string; value: string; mono?: boolean }>
}

function Connector({ delay, animate }: { delay: number; animate: boolean }) {
  return (
    <div className="relative ml-[23px] h-5 w-px overflow-hidden bg-slate-200" aria-hidden>
      {animate && (
        <span
          className="absolute left-0 top-0 h-2 w-px bg-blue-500 motion-safe:animate-flow-down motion-reduce:hidden"
          style={{ animationDelay: `${delay}ms` }}
        />
      )}
    </div>
  )
}

interface McpFlowProps {
  connection: GatewayConnection
  health: GatewayHealth | null
  tools: GatewayTool[]
  botNames: string[]
  registeredBots: number
  pausedBots: number
  defaultPolicy: 'allow' | 'deny'
  perMinute: number
  blockedToday: number
  successRate: number | null
  p50: number | null
}

export function McpFlow({ connection, health, tools, botNames, registeredBots, pausedBots, defaultPolicy, perMinute, blockedToday, successRate, p50 }: McpFlowProps) {
  const online = connection === 'online'
  const toolCount = (server: string) => tools.filter((t) => t.server === server).length
  const backendHost = health?.backend.replace(/^https?:\/\//, '') ?? '—'

  const nodes: FlowNode[] = [
    {
      id: 'bot',
      title: 'AI Bot',
      subtitle: `${botNames.length} ${botNames.length === 1 ? 'bot' : 'bots'} known to the gateway`,
      icon: Bot,
      details: [
        { label: 'Identity', value: '?bot= or X-AgentMesh-Bot', mono: true },
        { label: 'Bots', value: botNames.join(', ') || 'None yet' },
        { label: 'Protocol', value: 'MCP · streamable-http', mono: true },
      ],
    },
    {
      id: 'gateway',
      title: 'AgentMesh MCP Gateway',
      subtitle: online ? `${perMinute} calls/min · last 5 min` : connection === 'offline' ? 'Offline · run npm run gateway' : 'Connecting…',
      icon: Network,
      details: [
        { label: 'Endpoint', value: health?.mcpUrl ?? '—', mono: true },
        { label: 'Status', value: online ? 'Online' : connection === 'offline' ? 'Offline' : 'Connecting' },
        { label: 'Call log', value: 'gateway/data/mcp-calls.jsonl', mono: true },
      ],
    },
    {
      id: 'policy',
      title: 'Policy Check',
      subtitle: `${registeredBots} bot policies · ${blockedToday} blocked today`,
      icon: ShieldCheck,
      details: [
        { label: 'Allowlist', value: 'Per-bot tool scopes (bots.json)' },
        { label: 'Unregistered bots', value: defaultPolicy === 'allow' ? 'Allowed' : 'Blocked' },
        { label: 'Paused bots', value: String(pausedBots) },
      ],
    },
    {
      id: 'servers',
      title: 'Jira MCP / Slack MCP',
      subtitle: `${tools.length} tools · routed by namespace`,
      details: [
        { label: 'Jira MCP', value: `${toolCount('jira')} tools`, mono: true },
        { label: 'Slack MCP', value: `${toolCount('slack')} tools`, mono: true },
        { label: 'Backend', value: backendHost, mono: true },
      ],
    },
    {
      id: 'exec',
      title: 'Tool Execution',
      subtitle: successRate != null ? `${successRate}% success · p50 ${p50 ?? '—'} ms today` : 'No executed calls today',
      icon: Cpu,
      details: [
        { label: 'Credentials', value: 'OAuth tokens in WorkBridge' },
        { label: 'Timeout', value: '30s per call' },
        { label: 'Audit', value: 'Every call saved' },
      ],
    },
  ]

  const [selected, setSelected] = useState<NodeId>('gateway')
  const active = nodes.find((n) => n.id === selected)!

  return (
    <Panel className="flex flex-col">
      <PanelHeader
        title="MCP Gateway Flow"
        description="How a bot's tool call reaches Jira or Slack."
        actions={
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium',
              online ? 'bg-emerald-50 text-emerald-700' : connection === 'offline' ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-600',
            )}
          >
            <span className={cn('h-1.5 w-1.5 rounded-full', online ? 'animate-soft-pulse bg-emerald-500' : connection === 'offline' ? 'bg-red-500' : 'bg-slate-400')} />
            {online ? 'Online' : connection === 'offline' ? 'Offline' : 'Connecting'}
          </span>
        }
      />

      <div className="px-5 pt-4">
        {nodes.map((node, i) => {
          const Icon = node.icon
          const isSelected = node.id === selected
          const isGateway = node.id === 'gateway'
          return (
            <div key={node.id}>
              {i > 0 && <Connector delay={i * 300} animate={online && perMinute > 0} />}
              <button
                type="button"
                onClick={() => setSelected(node.id)}
                aria-pressed={isSelected}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-1.5 py-1.5 text-left transition-colors',
                  isSelected ? 'bg-blue-50/70 ring-1 ring-blue-200' : 'hover:bg-slate-50',
                )}
              >
                {node.id === 'servers' ? (
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center -space-x-2">
                    <AppIcon app="jira" size="xs" className="ring-2 ring-white" />
                    <AppIcon app="slack" size="xs" className="ring-2 ring-white" />
                  </span>
                ) : (
                  <span
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border',
                      isGateway ? 'border-slate-950 bg-slate-950 text-white' : isSelected ? 'border-blue-300 bg-white text-blue-600' : 'border-slate-200 bg-white text-slate-500',
                    )}
                  >
                    {Icon && <Icon className="h-4 w-4" strokeWidth={1.85} />}
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className={cn('block truncate text-[13px] font-medium', isSelected ? 'text-blue-900' : 'text-slate-900')}>{node.title}</span>
                  <span className="block truncate text-xs text-slate-500 tabular">{node.subtitle}</span>
                </span>
                <span className={cn('mr-1 h-2 w-2 shrink-0 rounded-full', online ? 'bg-emerald-500' : 'bg-slate-300')} />
              </button>
            </div>
          )
        })}
      </div>

      <div key={active.id} className="m-4 mt-4 animate-fade-in rounded-2xl bg-slate-50 p-4">
        <p className="mb-2.5 text-[13px] font-semibold text-slate-900">{active.title}</p>
        <dl className="space-y-1.5">
          {active.details.map((d) => (
            <div key={d.label} className="flex items-center justify-between gap-3 text-[12.5px]">
              <dt className="shrink-0 text-slate-500">{d.label}</dt>
              <dd className={cn('truncate text-right font-medium text-slate-800', d.mono && 'font-mono text-[12px]')}>{d.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Panel>
  )
}
