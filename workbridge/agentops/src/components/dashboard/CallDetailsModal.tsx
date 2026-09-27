import { Copy, OctagonX } from 'lucide-react'
import { appFor, serverName } from '../../data/apps'
import { clockTime } from '../../lib/time'
import type { McpCall } from '../../data/types'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { StatusBadge } from '../ui/StatusBadge'
import { AppIcon, CodeBlock } from '../ui/misc'
import { useToast } from '../ui/Toast'

export function CallDetailsModal({ call, onClose }: { call: McpCall | null; onClose: () => void }) {
  const toast = useToast()
  if (!call) return null

  const stats = [
    { label: 'Status', value: <StatusBadge status={call.status} /> },
    { label: 'Duration', value: call.status === 'blocked' ? '—' : `${call.durationMs.toLocaleString('en-GB')} ms` },
    { label: 'Source', value: call.source === 'test' ? 'Dashboard test' : 'MCP client' },
    { label: 'Time', value: `${new Date(call.at).toLocaleDateString('en-GB')} ${clockTime(call.at)}` },
  ]

  return (
    <Modal
      open
      size="lg"
      onClose={onClose}
      icon={<AppIcon app={appFor(call.server)} size="md" />}
      title={<code className="font-mono text-[15px]">{call.tool}</code>}
      description={
        <>
          <span className="font-medium text-slate-700">{call.bot}</span> via {serverName(call.server)} ·{' '}
          <span className="font-mono text-[12px]">{call.id}</span>
        </>
      }
      footer={
        <Button
          size="md"
          onClick={() => {
            void navigator.clipboard?.writeText(JSON.stringify({ ...call, at: new Date(call.at).toISOString() }, null, 2))
            toast({ title: 'Call record copied', description: call.id, tone: 'success' })
          }}
        >
          <Copy className="h-4 w-4" />
          Copy record
        </Button>
      }
    >
      <div className="space-y-5">
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-white p-3">
              <dt className="text-[11px] font-medium uppercase tracking-wider text-slate-400">{s.label}</dt>
              <dd className="mt-1 truncate text-[13px] font-medium text-slate-800 tabular">{s.value}</dd>
            </div>
          ))}
        </dl>

        {call.status === 'blocked' && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/60 p-3.5">
            <OctagonX className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
            <div className="text-[13px]">
              <p className="font-medium text-amber-900">Blocked by gateway policy — the tool was not executed</p>
              <p className="text-amber-800">{call.error}</p>
            </div>
          </div>
        )}

        <div>
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-400">Request</p>
          <CodeBlock value={{ method: 'tools/call', params: { name: call.tool.replace('.', '_'), arguments: call.args } }} />
        </div>
        {call.status !== 'blocked' && (
          <div>
            <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-400">
              {call.status === 'failed' ? 'Error' : 'Response preview'}
            </p>
            <pre
              className={
                call.status === 'failed'
                  ? 'whitespace-pre-wrap break-words rounded-xl border border-red-200 bg-red-50 p-3 font-mono text-[12px] text-red-700'
                  : 'scrollbar-thin max-h-64 overflow-y-auto whitespace-pre-wrap break-words rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-[12px] text-slate-700'
              }
            >
              {call.status === 'failed' ? call.error : (call.preview ?? 'No response body')}
            </pre>
          </div>
        )}
      </div>
    </Modal>
  )
}
