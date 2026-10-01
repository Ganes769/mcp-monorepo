import { Check, Loader2 } from 'lucide-react'
import type { FollowUp, Investigation } from '@/types'
import { AGENT_STAGES, TOOL_DESCRIPTION } from '@/lib/labels'
import { formatDate, formatDuration, relativeDay } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FollowUpStatusBadge } from '@/components/shared/badges'

function statusFor(investigation: Investigation): { label: string; dot: string } {
  if (investigation.state !== 'completed') return { label: 'Investigating', dot: 'bg-sun animate-pulse' }
  switch (investigation.stage) {
    case 'human_approval':
      return { label: 'Waiting for approval', dot: 'bg-peach' }
    case 'plan_action':
      return { label: 'Needs human review', dot: 'bg-coral' }
    case 'verify_payment':
      return { label: 'Monitoring for payment', dot: 'bg-lime' }
    default:
      return { label: 'Completed', dot: 'bg-lime' }
  }
}

export function AgentStatusPanel({ investigation, followUps }: { investigation: Investigation | null; followUps: FollowUp[] }) {
  const currentIndex = investigation ? AGENT_STAGES.findIndex((s) => s.key === investigation.stage) : -1
  const status = investigation ? statusFor(investigation) : { label: 'Not started', dot: 'bg-bar' }
  const running = investigation?.state === 'running'

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Agent status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="space-y-2 text-[13px]">
            <div className="flex items-center justify-between gap-2">
              <dt className="text-muted-foreground">Status</dt>
              <dd className="flex items-center gap-1.5 font-medium">
                <span className={cn('size-2 rounded-full', status.dot)} aria-hidden />
                {status.label}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-3">
              <dt className="shrink-0 text-muted-foreground">Current step</dt>
              <dd className="text-right font-medium">{investigation?.currentStep ?? '—'}</dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-muted-foreground">Elapsed</dt>
              <dd className="font-medium tabular">{investigation ? formatDuration(investigation.elapsedSeconds) : '—'}</dd>
            </div>
          </dl>

          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Tools used ({investigation?.toolsUsed.length ?? 0})</p>
            {investigation && investigation.toolsUsed.length > 0 ? (
              <ul className="space-y-1.5">
                {investigation.toolsUsed.map((tool) => (
                  <li key={tool} className="flex items-start gap-2 text-xs">
                    <Check className="mt-px size-3.5 shrink-0 text-lime-strong" aria-hidden />
                    <span>
                      <span className="font-mono text-[11px]">{tool}</span>
                      <span className="block text-muted-foreground">{TOOL_DESCRIPTION[tool]}</span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">No tools called yet.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Workflow</CardTitle>
        </CardHeader>
        <CardContent>
          <ol aria-label="Agent workflow">
            {AGENT_STAGES.map((stage, i) => {
              const state = i < currentIndex ? 'done' : i === currentIndex ? 'current' : 'upcoming'
              return (
                <li key={stage.key} className="relative flex items-center gap-3 pb-3 last:pb-0" aria-current={state === 'current' ? 'step' : undefined}>
                  {i < AGENT_STAGES.length - 1 && <span className={cn('absolute left-[11px] top-6 h-3 w-px', state === 'done' ? 'bg-lime' : 'bg-border')} aria-hidden />}
                  <span
                    className={cn(
                      'z-[1] flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold',
                      state === 'done' && 'bg-lime text-[#1c2a0c]',
                      state === 'current' && 'bg-primary text-primary-foreground',
                      state === 'upcoming' && 'border bg-card text-muted-foreground',
                    )}
                  >
                    {state === 'done' ? <Check className="size-3.5" strokeWidth={3} aria-hidden /> : state === 'current' && running ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : i + 1}
                  </span>
                  <span className={cn('text-[13px]', state === 'current' ? 'font-semibold' : state === 'done' ? 'font-medium' : 'text-muted-foreground')}>{stage.label}</span>
                  {state === 'current' && <span className="ml-auto rounded-full bg-sun-soft px-2 py-px text-[10.5px] font-semibold text-sun-strong">Now</span>}
                </li>
              )
            })}
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Follow-ups</CardTitle>
        </CardHeader>
        <CardContent>
          {followUps.length === 0 ? (
            <p className="text-xs text-muted-foreground">No follow-ups scheduled. One is created automatically when an action is approved.</p>
          ) : (
            <ul className="space-y-3">
              {followUps.map((f) => (
                <li key={f.id} className="text-[13px]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{f.action}</span>
                    <FollowUpStatusBadge status={f.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(f.dueAt)} · {relativeDay(f.dueAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
