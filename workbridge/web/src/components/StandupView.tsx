import { useState } from 'react'
import type { Issue, StandupData } from '../api/client'
import { cx, theme } from '../theme'
import { PageTitle } from './PageTitle'

type Props = {
  data: StandupData | null
  loading: boolean
  error: string | null
  onRefresh: () => void
  onPost: () => void
  posting: boolean
  projectName: string
  slackConnected?: boolean
}

type ViewId = 'team' | 'me' | 'risk'

export function StandupView({
  data,
  loading,
  error,
  onRefresh,
  onPost,
  posting,
  projectName,
  slackConnected = true,
}: Props) {
  const { classes } = theme
  const [view, setView] = useState<ViewId>('team')

  return (
    <div>
      <header className={cx(classes.hero, 'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between')}>
        <PageTitle section="Standup" projectName={projectName} />
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className={cx('cursor-pointer px-4 py-2 text-[13px] font-semibold disabled:opacity-50', classes.secondaryButton)}
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
          <button
            type="button"
            onClick={onPost}
            disabled={posting || loading || !slackConnected}
            className={cx('cursor-pointer px-4 py-2 text-[13px] font-semibold disabled:opacity-50', classes.primaryButton)}
          >
            {posting ? 'Posting…' : 'Post to Slack'}
          </button>
        </div>
      </header>

      <div className="space-y-5 px-8 py-6">
        {error && (
          <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] text-rose-700">
            {error}
          </p>
        )}

        {data && (
          <div className="flex gap-1 rounded-lg border border-[#E2E8F0] bg-white p-1">
            {(
              [
                ['team', 'Team'],
                ['me', 'Me'],
                ['risk', 'At risk'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setView(id)}
                className={cx(
                  'flex-1 cursor-pointer rounded-md px-3 py-2 text-[13px] font-semibold',
                  view === id ? 'bg-[#0F172A] text-white' : 'text-[#475569] hover:bg-[#F8FAFC]',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {data && view === 'team' && <TeamView data={data} classes={classes} />}
        {data && view === 'me' && <MeView data={data} classes={classes} />}
        {data && view === 'risk' && <RiskView data={data} classes={classes} />}

        {data?.text && (
          <section className={cx(classes.panel, 'overflow-hidden rounded-lg')}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] px-4 py-3">
              <h2 className={cx('text-[13px]', classes.heading)}>Slack preview · Team brief</h2>
              <button
                type="button"
                onClick={onPost}
                disabled={posting || loading || !slackConnected}
                className={cx('cursor-pointer px-4 py-2 text-[13px] font-semibold disabled:opacity-50', classes.primaryButton)}
              >
                {posting ? 'Posting…' : slackConnected ? 'Post to Slack' : 'Connect Slack to post'}
              </button>
            </div>
            <pre className="overflow-auto px-4 py-4 text-[12px] leading-6 text-[#334155]">
              {data.text}
            </pre>
          </section>
        )}
      </div>
    </div>
  )
}

function TeamView({
  data,
  classes,
}: {
  data: StandupData
  classes: (typeof theme)['classes']
}) {
  const counts = data.team.counts
  const metrics = [
    { label: 'Blocked', value: counts.blocked },
    { label: 'In progress', value: counts.in_progress },
    { label: 'Done since yesterday', value: counts.done_yesterday },
    { label: 'To do', value: counts.todo },
  ]

  return (
    <>
      <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-[#E2E8F0] bg-white sm:grid-cols-4">
        {metrics.map((metric, index) => (
          <div
            key={metric.label}
            className={cx('px-5 py-4', index > 0 && 'border-t border-[#E2E8F0] sm:border-t-0 sm:border-l')}
          >
            <p className={classes.muted}>{metric.label}</p>
            <p className={cx('mt-2 text-[28px] leading-8', classes.metricValue)}>{metric.value}</p>
          </div>
        ))}
      </div>
      <p className={classes.muted}>
        Rest of board: {counts.todo} to do · {counts.done} done · {counts.stale} stale ·{' '}
        {counts.unassigned} unassigned. Slack gets this team brief, not the full backlog.
      </p>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <IssueGroup title="Blocked" issues={data.team.blocked} classes={classes} />
        <IssueGroup
          title={`In progress (${data.team.in_progress.length} of ${counts.in_progress})`}
          issues={data.team.in_progress}
          classes={classes}
        />
        <IssueGroup title="Done since yesterday" issues={data.team.done_yesterday} classes={classes} />
      </div>
    </>
  )
}

function MeView({
  data,
  classes,
}: {
  data: StandupData
  classes: (typeof theme)['classes']
}) {
  if (data.me.empty) {
    return (
      <section className={cx(classes.panel, 'rounded-lg px-6 py-10 text-center')}>
        <p className={cx('text-[16px]', classes.heading)}>{data.me.emptyMessage}</p>
        <p className={cx('mt-2', classes.body)}>
          {data.me.displayName
            ? `No in-progress, blocked, or recently done work for ${data.me.displayName}.`
            : 'Connect Jira, then refresh to see work assigned to you.'}
        </p>
      </section>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <IssueGroup title="My blocked" issues={data.me.blocked} classes={classes} />
      <IssueGroup title="My in progress" issues={data.me.in_progress} classes={classes} />
      <IssueGroup title="I finished since yesterday" issues={data.me.done_yesterday} classes={classes} />
    </div>
  )
}

function RiskView({
  data,
  classes,
}: {
  data: StandupData
  classes: (typeof theme)['classes']
}) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <IssueGroup title="Blocked" issues={data.atRisk.blocked} classes={classes} />
      <IssueGroup
        title={`Stale in progress (${data.staleDays}d)`}
        issues={data.atRisk.stale}
        classes={classes}
      />
      <IssueGroup title="Unassigned in progress" issues={data.atRisk.unassigned} classes={classes} />
    </div>
  )
}

function IssueGroup({
  title,
  issues,
  classes,
}: {
  title: string
  issues: Issue[]
  classes: (typeof theme)['classes']
}) {
  return (
    <section className={cx(classes.panel, 'overflow-hidden rounded-lg')}>
      <div className="flex items-center justify-between border-b border-[#E2E8F0] px-4 py-3">
        <h2 className={cx('text-[13px]', classes.heading)}>{title}</h2>
        <span className={classes.muted}>{issues.length}</span>
      </div>
      <ul>
        {issues.length === 0 && (
          <li className={cx('px-4 py-6 text-center', classes.muted)}>No items</li>
        )}
        {issues.map((issue) => (
          <li key={issue.key}>
            <a
              href={issue.url}
              target="_blank"
              rel="noreferrer"
              className={cx(classes.inset, 'block hover:bg-[#F8FAFC]')}
            >
              <div className="flex items-baseline justify-between gap-3">
                <p className={cx('text-[13px]', classes.heading)}>{issue.key}</p>
                <p className={classes.muted}>{issue.status || '—'}</p>
              </div>
              <p className={cx('mt-0.5 truncate', classes.body)}>{issue.summary}</p>
              <p className={cx('mt-1', classes.muted)}>{issue.assignee || 'Unassigned'}</p>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
