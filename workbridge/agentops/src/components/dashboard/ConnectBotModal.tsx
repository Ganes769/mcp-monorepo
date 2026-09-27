import { useMemo, useState } from 'react'
import { Check, Copy, Loader2, Send } from 'lucide-react'
import { cn } from '../../lib/cn'
import type { GatewayBotConfig, GatewayHealth, GatewayTool, McpCall } from '../../data/types'
import type { GatewayConnection } from '../../state/useGateway'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { StatusBadge } from '../ui/StatusBadge'
import { useToast } from '../ui/Toast'

type Client = 'cursor' | 'claude' | 'http'

const CLIENTS: Array<{ key: Client; label: string; file: string }> = [
  { key: 'cursor', label: 'Cursor', file: '~/.cursor/mcp.json' },
  { key: 'claude', label: 'Claude Desktop', file: 'claude_desktop_config.json' },
  { key: 'http', label: 'Any MCP client', file: 'Streamable HTTP' },
]

function snippet(client: Client, url: string, bot: string): string {
  if (client === 'cursor') return JSON.stringify({ mcpServers: { agentmesh: { url } } }, null, 2)
  if (client === 'claude') return JSON.stringify({ mcpServers: { agentmesh: { command: 'npx', args: ['-y', 'mcp-remote', url] } } }, null, 2)
  return [`URL:     ${url.split('?')[0]}`, 'Transport: streamable-http (POST)', `Header:  X-AgentMesh-Bot: ${bot}`].join('\n')
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <Button
      size="xs"
      onClick={() => {
        void navigator.clipboard?.writeText(value)
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1500)
      }}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Copied' : 'Copy'}
    </Button>
  )
}

interface ConnectBotModalProps {
  open: boolean
  onClose: () => void
  connection: GatewayConnection
  health: GatewayHealth | null
  tools: GatewayTool[]
  bots: GatewayBotConfig[]
  projectKey?: string
  onTestCall: (bot: string, tool: string, args: Record<string, unknown>) => Promise<McpCall>
  onViewCall: (call: McpCall) => void
}

const READ_ONLY_TOOLS = ['jira.list_projects', 'jira.search_issues', 'jira.get_issue', 'jira.standup_report']

export function ConnectBotModal({ open, onClose, connection, health, tools, bots, projectKey, onTestCall, onViewCall }: ConnectBotModalProps) {
  const toast = useToast()
  const [bot, setBot] = useState(bots[0]?.name ?? 'Engineering Bot')
  const [client, setClient] = useState<Client>('cursor')
  const [tool, setTool] = useState('jira.list_projects')
  const [sending, setSending] = useState(false)
  const [lastResult, setLastResult] = useState<McpCall | null>(null)

  const baseUrl = health?.mcpUrl ?? 'http://127.0.0.1:8787/mcp'
  const url = `${baseUrl}?bot=${encodeURIComponent(bot)}`
  const config = snippet(client, url, bot)
  const testTools = useMemo(() => tools.filter((t) => READ_ONLY_TOOLS.includes(t.name)), [tools])
  const needsProject = tool !== 'jira.list_projects' && tool !== 'jira.get_issue'

  const send = async () => {
    setSending(true)
    try {
      const args: Record<string, unknown> =
        tool === 'jira.get_issue' ? { issueKey: `${projectKey ?? 'KAN'}-1` } : needsProject ? { projectKey: projectKey ?? 'KAN', ...(tool === 'jira.search_issues' ? { maxResults: 5 } : {}) } : {}
      const call = await onTestCall(bot, tool, args)
      setLastResult(call)
      toast({
        tone: call.status === 'success' ? 'success' : call.status === 'blocked' ? 'info' : 'error',
        title: `${call.tool} · ${call.status}`,
        description: call.status === 'success' ? `${call.durationMs} ms · saved to the activity log` : call.error,
      })
    } catch (err) {
      toast({ tone: 'error', title: 'Test call failed', description: err instanceof Error ? err.message : undefined })
    } finally {
      setSending(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Connect a bot to AgentMesh"
      description="Point any MCP client at the gateway. Each call is policy-checked, timed and saved to your activity log."
    >
      <div className="space-y-5">
        {connection !== 'online' && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5 text-[13px] text-amber-900">
            The gateway isn't reachable. Start it with <code className="rounded bg-amber-100 px-1 font-mono text-[12px]">npm run gateway</code> in{' '}
            <code className="font-mono text-[12px]">workbridge/agentops</code>.
          </div>
        )}

        <div>
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-400">Bot identity</p>
          <div className="flex flex-wrap gap-1.5">
            {bots.map((b) => (
              <button
                key={b.name}
                type="button"
                onClick={() => setBot(b.name)}
                className={cn(
                  'rounded-lg border px-2.5 py-1 text-[13px] font-medium transition-colors',
                  bot === b.name ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 text-slate-700 hover:border-slate-300',
                )}
              >
                {b.name}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-slate-500">
            Scopes: {bots.find((b) => b.name === bot)?.scopes.join(', ') ?? '—'} · edit in <code className="font-mono">gateway/bots.json</code>
          </p>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">MCP URL</p>
            <CopyButton value={url} />
          </div>
          <code className="block truncate rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-[12.5px] text-slate-800">{url}</code>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-1">
              {CLIENTS.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setClient(c.key)}
                  className={cn(
                    'h-7 rounded-lg px-2.5 text-[13px] font-medium transition-colors',
                    client === c.key ? 'bg-slate-100 text-slate-950' : 'text-slate-500 hover:text-slate-900',
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <CopyButton value={config} />
          </div>
          <pre className="scrollbar-thin overflow-x-auto rounded-xl border border-slate-200 bg-slate-950 p-3 font-mono text-[12px] leading-relaxed text-slate-100">{config}</pre>
          <p className="mt-1.5 text-xs text-slate-500">{CLIENTS.find((c) => c.key === client)!.file}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 p-4">
          <p className="text-[13px] font-semibold text-slate-900">Send a test call</p>
          <p className="mt-0.5 text-xs text-slate-500">Runs a read-only tool as {bot} through the same policy and logging path as a real MCP call.</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <select
              value={tool}
              onChange={(e) => setTool(e.target.value)}
              className="h-8 rounded-lg border border-slate-200 bg-white px-2 font-mono text-[12.5px] text-slate-800 focus:border-blue-400 focus:outline-none"
            >
              {testTools.map((t) => (
                <option key={t.name} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
            <Button size="sm" variant="accent" disabled={sending || connection !== 'online'} onClick={() => void send()}>
              {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Send test call
            </Button>
            {lastResult && (
              <button type="button" onClick={() => onViewCall(lastResult)} className="flex items-center gap-2 text-[13px] text-slate-600 hover:text-slate-900">
                <StatusBadge status={lastResult.status} />
                {lastResult.status !== 'blocked' && <span className="font-mono text-[12px] tabular">{lastResult.durationMs} ms</span>}
                <span className="font-medium">View</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}
