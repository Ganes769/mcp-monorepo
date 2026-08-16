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
            ? 'Could not match your Slack user. Reconnect Slack, then try Send me again.'
            : 'No matching Slack user to send to.',
      )
    } catch (err) {
      setSendNote(err instanceof Error ? err.message : 'Failed to send DM')
    } finally {
      setSendingId(null)
    }
  }

  const sendingMe = sendingId === 'me'

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
            onClick={() => sendPrep({ toMe: true, accountId: data?.me?.accountId })}
            disabled={!projectKey || posting || loading || !slackConnected || Boolean(sendingId)}
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
      </header>

      <div className="space-y-5 px-8 py-6">
        {sendNote && (
          <p className="rounded-md border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-2 text-[13px] text-[#1D4ED8]">
            {sendNote}
          </p>
        )}

        <section className={cx(classes.panel, 'rounded-lg p-5')}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-blue-700">
              AI morning brief
            </p>
            <button
              type="button"
              onClick={() => sendPrep({ toMe: true, accountId: data?.me?.accountId })}
              disabled={!data || !projectKey || !slackConnected || Boolean(sendingId)}
              className={cx('cursor-pointer px-4 py-2 text-[13px] font-semibold disabled:opacity-50', classes.primaryButton)}
            >
              {sendingMe ? 'Sending…' : slackConnected ? 'Send me' : 'Connect Slack'}
            </button>
          </div>
          {loading && !data && (
            <p className={cx('mt-3', classes.body)}>Writing the morning brief…</p>
          )}
          {!loading && !data && (
            <p className={cx('mt-3', classes.body)}>
              Select a Jira project, then open Standup. The AI brief appears here.
            </p>
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
                {data.ai.asks.map((ask) => (
                  <li key={ask} className={cx('text-[14px] leading-6', classes.body)}>
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
          <SendPrepPanel
            assignees={data.assignees || []}
            meAccountId={data.me?.accountId}
            projectKey={projectKey}
            slackConnected={slackConnected}
            sendingId={sendingId}
            sendNote={sendNote}
            onSend={(accountId) => sendPrep({ accountId })}
            onSendMe={() => sendPrep({ toMe: true, accountId: data.me?.accountId })}
            classes={classes}
          />
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
        {data && view === 'me' && (
          <MeView
            data={data}
            classes={classes}
            projectKey={projectKey}
            slackConnected={slackConnected}
            sendingId={sendingId}
            onSend={() => sendPrep({ toMe: true, accountId: data.me?.accountId })}
          />
        )}
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
        {questions.map((question) => (
          <li key={question} className={cx('text-[14px] leading-6', classes.body)}>
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
  projectKey,
  slackConnected,
  sendingId,
  onSend,
}: {
  data: StandupData
  classes: (typeof theme)['classes']
  projectKey?: string
  slackConnected: boolean
  sendingId: string | null
  onSend: () => void
}) {
  const mine = (data.assignees || []).find((person) => person.accountId === data.me.accountId)
  const questions = mine?.questions || data.ai?.questions || []

  return (
    <>
      {questions.length > 0 && (
        <section className={cx(classes.panel, 'rounded-lg p-5')}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className={cx('text-[13px]', classes.heading)}>Questions you need to answer in DSU</p>
              <ol className="mt-3 list-decimal space-y-2 pl-5">
                {questions.map((question) => (
                  <li key={question} className={cx('text-[14px] leading-6', classes.body)}>
                    {question}
                  </li>
                ))}
              </ol>
            </div>
            {data.me.accountId && (
              <button
                type="button"
                onClick={() => onSend()}
                disabled={!projectKey || !slackConnected || sendingId === 'me' || sendingId === data.me.accountId}
                className={cx('cursor-pointer px-4 py-2 text-[13px] font-semibold disabled:opacity-50', classes.primaryButton)}
              >
                {sendingId === 'me' || sendingId === data.me.accountId ? 'Sending…' : 'Send me'}
              </button>
            )}
          </div>
        </section>
      )}
      {data.me.empty ? (
        <section className={cx(classes.panel, 'rounded-lg px-6 py-10 text-center')}>
          <p className={cx('text-[16px]', classes.heading)}>{data.me.emptyMessage}</p>
          <p className={cx('mt-2', classes.body)}>
            {data.me.displayName
              ? `No in-progress, blocked, or recently done work for ${data.me.displayName}.`
              : 'Connect Jira, then refresh to see work assigned to you.'}
          </p>
        </section>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <IssueGroup title="My blocked" issues={data.me.blocked} classes={classes} />
          <IssueGroup title="My in progress" issues={data.me.in_progress} classes={classes} />
          <IssueGroup title="I finished since yesterday" issues={data.me.done_yesterday} classes={classes} />
        </div>
      )}
    </>
  )
}

function SendPrepPanel({
  assignees,
  meAccountId,
  projectKey,
  slackConnected,
  sendingId,
  sendNote,
  onSend,
  onSendMe,
  classes,
}: {
  assignees: NonNullable<StandupData['assignees']>
  meAccountId?: string
  projectKey?: string
  slackConnected: boolean
  sendingId: string | null
  sendNote: string | null
  onSend: (accountId?: string) => void
  onSendMe: () => void
  classes: (typeof theme)['classes']
}) {
  const people = [...assignees].sort((a, b) => {
    if (a.accountId === meAccountId) return -1
    if (b.accountId === meAccountId) return 1
    return (a.displayName || '').localeCompare(b.displayName || '')
  })

  return (
    <section className={cx(classes.panel, 'overflow-hidden rounded-lg')}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#E2E8F0] px-4 py-3">
        <div>
          <h2 className={cx('text-[13px]', classes.heading)}>Send DSU prep now</h2>
          <p className={cx('mt-1', classes.muted)}>
            {slackConnected
              ? 'Send your DSU prep to yourself in Slack. Use a row below to ping someone else.'
              : 'Connect Slack to send a prep DM.'}
          </p>
        </div>
        <button
          type="button"
          onClick={onSendMe}
          disabled={!projectKey || !slackConnected || Boolean(sendingId)}
          className={cx('cursor-pointer px-4 py-2 text-[13px] font-semibold disabled:opacity-50', classes.primaryButton)}
        >
          {sendingId === 'me' || sendingId === meAccountId ? 'Sending…' : 'Send me'}
        </button>
      </div>
      {people.length === 0 ? (
        <p className={cx('px-4 py-6 text-center', classes.muted)}>
          No assignees on this board yet. Refresh after tickets are assigned.
        </p>
      ) : (
        <ul>
          {people.map((person) => {
            const sending = sendingId === person.accountId
            return (
              <li
                key={person.accountId}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] px-4 py-3 last:border-b-0"
              >
                <div className="min-w-0">
                  <p className={cx('text-[14px]', classes.heading)}>
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
      )}
      {sendNote && <p className={cx('border-t border-[#E2E8F0] px-4 py-3', classes.body)}>{sendNote}</p>}
    </section>
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
