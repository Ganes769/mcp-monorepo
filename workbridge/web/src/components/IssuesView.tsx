import type { Issue } from '../api/client'
import { cx, theme } from '../theme'
import { PageTitle } from './PageTitle'

type Props = {
  projectKey: string
  projectName: string
  issues: Issue[]
  total: number
  loading: boolean
  error: string | null
  onRefresh: () => void
}

export function IssuesView({
  projectKey,
  projectName,
  issues,
  total,
  loading,
  error,
  onRefresh,
}: Props) {
  const { classes } = theme

  return (
    <div>
      <header className={cx(classes.hero, 'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between')}>
        <PageTitle section="Issues" projectName={projectName || projectKey} />
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className={cx('px-3 py-1.5 text-[13px] font-medium disabled:opacity-50', classes.secondaryButton)}
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </header>

      <div className="space-y-5 px-8 py-6">
        <p className={classes.body}>
          {total} issue{total === 1 ? '' : 's'} in board order.
        </p>
        {error && (
          <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] text-rose-700">
            {error}
          </p>
        )}

        <section className={cx(classes.panel, 'overflow-hidden rounded-lg')}>
          <div className="hidden grid-cols-[88px_1.6fr_0.8fr_1fr_0.7fr] border-b border-[#E2E8F0] px-4 py-2.5 sm:grid">
            <span className={classes.muted}>Key</span>
            <span className={classes.muted}>Summary</span>
            <span className={classes.muted}>Status</span>
            <span className={classes.muted}>Assignee</span>
            <span className={classes.muted}>Priority</span>
          </div>
          <ul>
            {issues.map((issue) => (
              <li key={issue.key}>
                <a
                  href={issue.url}
                  target="_blank"
                  rel="noreferrer"
                  className={cx(
                    classes.inset,
                    'grid gap-1 hover:bg-[#F8FAFC] sm:grid-cols-[88px_1.6fr_0.8fr_1fr_0.7fr] sm:items-center',
                  )}
                >
                  <span className={cx('text-[13px]', classes.heading)}>{issue.key}</span>
                  <span className={cx('truncate text-[13px]', classes.body)}>{issue.summary}</span>
                  <span className={classes.muted}>{issue.status || '—'}</span>
                  <span className={classes.muted}>{issue.assignee || 'Unassigned'}</span>
                  <span className={classes.muted}>{issue.priority || '—'}</span>
                </a>
              </li>
            ))}
            {!loading && issues.length === 0 && (
              <li className={cx('px-4 py-8 text-center', classes.muted)}>
                No issues for this project.
              </li>
            )}
          </ul>
        </section>
      </div>
    </div>
  )
}
