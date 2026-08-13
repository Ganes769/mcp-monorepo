import type { StandupData } from '../api/client'
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
}

const sections: { key: keyof StandupData['counts']; title: string }[] = [
  { key: 'blocked', title: 'Blocked' },
  { key: 'in_progress', title: 'In progress' },
  { key: 'todo', title: 'To do' },
  { key: 'done', title: 'Done' },
]

export function StandupView({
  data,
  loading,
  error,
  onRefresh,
  onPost,
  posting,
  projectName,
}: Props) {
  const { classes } = theme

  return (
    <div>
      <header className={cx(classes.hero, 'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between')}>
        <PageTitle section="Standup" projectName={projectName} />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className={cx('px-3 py-1.5 text-[13px] font-medium disabled:opacity-50', classes.secondaryButton)}
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
          <button
            type="button"
            onClick={onPost}
            disabled={posting || loading}
            className={cx('px-3 py-1.5 text-[13px] font-medium disabled:opacity-50', classes.primaryButton)}
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
          <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-[#E2E8F0] bg-white sm:grid-cols-4">
            {sections.map((section, index) => (
              <div
                key={section.key}
                className={cx(
                  'px-5 py-4',
                  index > 0 && 'border-t border-[#E2E8F0] sm:border-t-0 sm:border-l',
                )}
              >
                <p className={classes.muted}>{section.title}</p>
                <p className={cx('mt-2 text-[28px] leading-8', classes.metricValue)}>
                  {data.counts[section.key]}
                </p>
              </div>
            ))}
          </div>
        )}

        {data && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {sections.map((section) => (
              <section key={section.key} className={cx(classes.panel, 'overflow-hidden rounded-lg')}>
                <div className="flex items-center justify-between border-b border-[#E2E8F0] px-4 py-3">
                  <h2 className={cx('text-[13px]', classes.heading)}>{section.title}</h2>
                  <span className={classes.muted}>{data.counts[section.key]}</span>
                </div>
                <ul>
                  {data[section.key].length === 0 && (
                    <li className={cx('px-4 py-6 text-center', classes.muted)}>No items</li>
                  )}
                  {data[section.key].map((issue) => (
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
                        <p className={cx('mt-1', classes.muted)}>
                          {issue.assignee || 'Unassigned'}
                        </p>
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}

        {data?.text && (
          <section className={cx(classes.panel, 'overflow-hidden rounded-lg')}>
            <div className="border-b border-[#E2E8F0] px-4 py-3">
              <h2 className={cx('text-[13px]', classes.heading)}>Slack preview</h2>
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
