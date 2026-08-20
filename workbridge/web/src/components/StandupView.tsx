import { useState } from 'react'
import { api, type Issue, type StandupData } from '../api/client'
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
  projectKey?: string
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
  projectKey,
  slackConnected = true,
}: Props) {
  const { classes } = theme
  const [view, setView] = useState<ViewId>('team')
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [sendNote, setSendNote] = useState<string | null>(null)
  const [showOthers, setShowOthers] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const sendPrep = async (options?: { accountId?: string; toMe?: boolean }) => {
    if (!projectKey || !slackConnected) return
    const sendingKey = options?.toMe ? 'me' : options?.accountId || 'all'
    setSendingId(sendingKey)
    setSendNote(null)
    try {
      const result = await api.sendPrep(projectKey, options)
      const sent = result.sent?.length || 0
      const skipped = result.skipped?.length || 0
      setSendNote(
        sent
          ? options?.toMe
            ? 'Sent your DSU prep to Slack.'
            : `Sent Slack DM${sent === 1 ? '' : 's'} (${sent})${skipped ? `, skipped ${skipped}` : ''}.`
          : skipped
            ? 'Could not match that Slack user. Reconnect Slack, then try again.'
            : 'No matching Slack user to send to.',
      )
    } catch (err) {
      setSendNote(err instanceof Error ? err.message : 'Failed to send DM')
    } finally {
      setSendingId(null)
    }
  }

  const sendingMe = sendingId === 'me'
  const canSend = Boolean(projectKey && slackConnected && !sendingId && !loading)

  return (
    <div>
      <header className={cx(classes.hero, 'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between')}>
        <div>
          <PageTitle section="Standup" projectName={projectName} />
          <p className={cx('mt-1', classes.muted)}>Read the brief, check the board, then send to Slack.</p>
        </div>
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
            onClick={() => sendPrep({ toMe: true, accountId: data?.me?.accountId })}
            disabled={!canSend}
            className={cx('cursor-pointer px-4 py-2 text-[13px] font-semibold disabled:opacity-50', classes.primaryButton)}
          >
            {sendingMe ? 'Sending…' : 'Send me'}
          </button>
          <button
            type="button"
            onClick={onPost}
            disabled={posting || loading || !slackConnected || !data}
            className={cx('cursor-pointer px-4 py-2 text-[13px] font-semibold disabled:opacity-50', classes.secondaryButton)}
          >
            {posting ? 'Posting…' : 'Post to Slack'}
          </button>
        </div>
      </header>

      <div className="space-y-5 px-8 py-6">
        <ol className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {[
            { n: '1', label: 'Brief', hint: 'Questions for DSU' },
            { n: '2', label: 'Board', hint: 'Team, me, at risk' },
            { n: '3', label: 'Share', hint: 'DM or post' },
          ].map((step) => (
            <li
              key={step.n}
              className="flex items-center gap-3 rounded-lg border border-[#E2E8F0] bg-white px-3 py-2.5"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0F172A] text-[11px] font-semibold text-white">
                {step.n}
              </span>
              <span>
                <span className={cx('block text-[13px]', classes.heading)}>{step.label}</span>
                <span className={classes.muted}>{step.hint}</span>
              </span>
            </li>
          ))}
        </ol>

        {error && (
          <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] text-rose-700">
            {error}
          </p>
        )}
        {sendNote && (
          <p className="rounded-md border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-2 text-[13px] text-[#1D4ED8]">
            {sendNote}
          </p>
        )}
        {!projectKey && (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-800">
            Pick a Jira project first. Open Projects, then come back to Standup.
          </p>
        )}

        <section className={cx(classes.panel, 'rounded-lg p-5')}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-blue-700">
                1 · AI morning brief
              </p>
              <p className={cx('mt-1', classes.muted)}>What to say in DSU today</p>
            </div>
            <button
              type="button"
              onClick={() => sendPrep({ toMe: true, accountId: data?.me?.accountId })}
              disabled={!data || !canSend}
              className={cx('cursor-pointer px-4 py-2 text-[13px] font-semibold disabled:opacity-50', classes.primaryButton)}
            >
              {sendingMe ? 'Sending…' : slackConnected ? 'Send me' : 'Connect Slack'}
            </button>
          </div>
          {loading && !data && (
            <p className={cx('mt-3', classes.body)}>Writing the morning brief…</p>
          )}
          {!loading && !data && projectKey && (
            <p className={cx('mt-3', classes.body)}>Refresh Standup to load the brief from Jira.</p>
          )}
          {data?.ai?.status === 'ok' && data.ai.summary && (
            <p className={cx('mt-3 whitespace-pre-line', classes.body)}>{data.ai.summary}</p>
          )}
          {data && (
            <DsuQuestions
              questions={
                data.ai?.questions?.length
                  ? data.ai.questions
                  : (data.assignees || []).find((person) => person.accountId === data.me?.accountId)
                      ?.questions || [
                      'What did you finish yesterday?',
                      'What will you work on today?',
                      'What is blocked, and who can help?',
                    ]
              }
              classes={classes}
            />
          )}
          {data?.ai?.status === 'ok' && data.ai.asks && data.ai.asks.length > 0 && (
            <div className="mt-4">
              <p className={cx('text-[13px]', classes.heading)}>Suggested asks</p>
              <ul className="mt-2 space-y-2">
                {data.ai.asks.map((ask, index) => (
                  <li key={`${index}-${ask}`} className={cx('text-[14px] leading-6', classes.body)}>
                    {ask}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {data && data.ai?.status !== 'ok' && (
            <p className={cx('mt-3', classes.body)}>
              {data.ai?.reason || 'AI brief is not available yet. Redeploy the API with GROQ_API_KEY, then refresh Standup.'}
            </p>
          )}
        </section>

        {data && (
          <section className="space-y-4">
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-blue-700">
              2 · Board
            </p>
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
            {view === 'team' && <TeamView data={data} classes={classes} />}
            {view === 'me' && <MeView data={data} classes={classes} />}
            {view === 'risk' && <RiskView data={data} classes={classes} />}
          </section>
        )}

        {data && (
          <section className={cx(classes.panel, 'overflow-hidden rounded-lg')}>
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#E2E8F0] px-4 py-3">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-blue-700">
                  3 · Share
                </p>
                <h2 className={cx('mt-1 text-[13px]', classes.heading)}>Send DSU prep</h2>
                <p className={cx('mt-1', classes.muted)}>
                  {slackConnected
                    ? 'DM yourself, or open the list to ping someone else. Post sends the team brief to the channel.'
                    : 'Connect Slack to send DMs and post the brief.'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => sendPrep({ toMe: true, accountId: data.me?.accountId })}
                  disabled={!canSend}
                  className={cx('cursor-pointer px-4 py-2 text-[13px] font-semibold disabled:opacity-50', classes.primaryButton)}
                >
                  {sendingMe ? 'Sending…' : 'Send me'}
                </button>
                <button
                  type="button"
                  onClick={onPost}
                  disabled={posting || loading || !slackConnected}
                  className={cx('cursor-pointer px-4 py-2 text-[13px] font-semibold disabled:opacity-50', classes.secondaryButton)}
                >
                  {posting ? 'Posting…' : 'Post to Slack'}
                </button>
              </div>
            </div>
            <SendPrepList
              assignees={data.assignees || []}
              meAccountId={data.me?.accountId}
              projectKey={projectKey}
              slackConnected={slackConnected}
              sendingId={sendingId}
              showOthers={showOthers}
              onToggleOthers={() => setShowOthers((open) => !open)}
              onSend={(accountId) => sendPrep({ accountId })}
              classes={classes}
            />
            {data.text && (
              <div className="border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setShowPreview((open) => !open)}
                  className={cx(
                    'flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left',
                    classes.body,
                  )}
                >
                  <span className={classes.heading}>Slack preview</span>
                  <span className={classes.muted}>{showPreview ? 'Hide' : 'Show'}</span>
                </button>
                {showPreview && (
                  <pre className="overflow-auto border-t border-[#E2E8F0] px-4 py-4 text-[12px] leading-6 text-[#334155]">
                    {data.text}
                  </pre>
                )}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}

function DsuQuestions({
  questions,
  classes,
}: {
  questions: string[]
  classes: (typeof theme)['classes']
}) {
  if (!questions.length) return null
  return (
    <div className="mt-4">
      <p className={cx('text-[13px]', classes.heading)}>Questions to answer in DSU</p>
      <ol className="mt-2 list-decimal space-y-2 pl-5">
        {questions.map((question, index) => (
          <li key={`${index}-${question}`} className={cx('text-[14px] leading-6', classes.body)}>
            {question}
          </li>
        ))}
      </ol>
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
  const team = data.team
  const counts = team?.counts
  if (!team || !counts) {
    return (
      <p className={classes.body}>Standup team data is missing. Refresh after connecting Jira.</p>
    )
  }
  const blocked = team.blocked || []
  const inProgress = team.in_progress || []
  const doneYesterday = team.done_yesterday || []
  const metrics = [
    { label: 'Blocked', value: counts.blocked ?? 0 },
    { label: 'In progress', value: counts.in_progress ?? 0 },
    { label: 'Done since yesterday', value: counts.done_yesterday ?? 0 },
    { label: 'To do', value: counts.todo ?? 0 },
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
        Rest of board: {counts.todo ?? 0} to do · {counts.done ?? 0} done · {counts.stale ?? 0} stale ·{' '}
        {counts.unassigned ?? 0} unassigned. Slack gets this team brief, not the full backlog.
      </p>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <IssueGroup title="Blocked" issues={blocked} classes={classes} />
        <IssueGroup
          title={`In progress (${inProgress.length} of ${counts.in_progress ?? 0})`}
          issues={inProgress}
          classes={classes}
        />
        <IssueGroup title="Done since yesterday" issues={doneYesterday} classes={classes} />
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
  const me = data.me
  if (me?.empty) {
    return (
      <section className={cx(classes.panel, 'rounded-lg px-6 py-10 text-center')}>
        <p className={cx('text-[16px]', classes.heading)}>{me.emptyMessage || 'Nothing assigned to you'}</p>
        <p className={cx('mt-2', classes.body)}>
          {me.displayName
            ? `No in-progress, blocked, or recently done work for ${me.displayName}.`
            : 'Connect Jira, then refresh to see work assigned to you.'}
        </p>
      </section>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <IssueGroup title="My blocked" issues={me?.blocked || []} classes={classes} />
      <IssueGroup title="My in progress" issues={me?.in_progress || []} classes={classes} />
      <IssueGroup title="I finished since yesterday" issues={me?.done_yesterday || []} classes={classes} />
    </div>
  )
}

function SendPrepList({
  assignees,
  meAccountId,
  projectKey,
  slackConnected,
  sendingId,
  showOthers,
  onToggleOthers,
  onSend,
  classes,
}: {
  assignees: NonNullable<StandupData['assignees']>
  meAccountId?: string
  projectKey?: string
  slackConnected: boolean
  sendingId: string | null
  showOthers: boolean
  onToggleOthers: () => void
  onSend: (accountId?: string) => void
  classes: (typeof theme)['classes']
}) {
  const people = [...assignees].filter(Boolean).sort((a, b) => {
    if (a.accountId === meAccountId) return -1
    if (b.accountId === meAccountId) return 1
    return (a.displayName || '').localeCompare(b.displayName || '')
  })
  const others = people.filter((person) => person.accountId !== meAccountId)
  const visible = showOthers ? people : people.filter((person) => person.accountId === meAccountId)

  if (people.length === 0) {
    return (
      <p className={cx('px-4 py-6 text-center', classes.muted)}>
        No assignees on this board yet. Refresh after tickets are assigned.
      </p>
    )
  }

  return (
    <>
      <ul>
        {visible.map((person, index) => {
          const sending = sendingId === person.accountId
          return (
            <li
              key={person.accountId || `person-${index}`}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] px-4 py-3 last:border-b-0"
            >
              <div className="min-w-0">
                <p className={cx('truncate text-[14px]', classes.heading)}>
                  {person.displayName || person.accountId}
                  {person.accountId === meAccountId ? ' (you)' : ''}
                </p>
                <p className={classes.muted}>
                  {(person.blocked?.length || 0) +
                    (person.in_progress?.length || 0) +
                    (person.done_yesterday?.length || 0)}{' '}
                  tickets · {(person.questions || []).length} DSU questions
                </p>
              </div>
              <button
                type="button"
                onClick={() => onSend(person.accountId)}
                disabled={!projectKey || !slackConnected || sending || Boolean(sendingId)}
                className={cx(
                  'cursor-pointer px-4 py-2 text-[13px] font-semibold disabled:opacity-50',
                  classes.secondaryButton,
                )}
              >
                {sending ? 'Sending…' : 'Send Slack DM'}
              </button>
            </li>
          )
        })}
      </ul>
      {others.length > 0 && (
        <button
          type="button"
          onClick={onToggleOthers}
          className={cx('w-full cursor-pointer border-t border-[#E2E8F0] px-4 py-3 text-left', classes.body)}
        >
          {showOthers ? 'Hide other people' : `DM someone else (${others.length})`}
        </button>
      )}
    </>
  )
}

function RiskView({
  data,
  classes,
}: {
  data: StandupData
  classes: (typeof theme)['classes']
}) {
  const atRisk = data.atRisk
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <IssueGroup title="Blocked" issues={atRisk?.blocked || []} classes={classes} />
      <IssueGroup
        title={`Stale in progress (${data.staleDays}d)`}
        issues={atRisk?.stale || []}
        classes={classes}
      />
      <IssueGroup title="Unassigned in progress" issues={atRisk?.unassigned || []} classes={classes} />
    </div>
  )
}

function IssueGroup({
  title,
  issues,
  classes,
}: {
  title: string
  issues: Issue[] | undefined
  classes: (typeof theme)['classes']
}) {
  const items = issues || []
  return (
    <section className={cx(classes.panel, 'overflow-hidden rounded-lg')}>
      <div className="flex items-center justify-between border-b border-[#E2E8F0] px-4 py-3">
        <h2 className={cx('text-[13px]', classes.heading)}>{title}</h2>
        <span className={classes.muted}>{items.length}</span>
      </div>
      <ul>
        {items.length === 0 && (
          <li className={cx('px-4 py-6 text-center', classes.muted)}>No items</li>
        )}
        {items.map((issue, index) => (
          <li key={issue.key || `${title}-${index}`}>
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
