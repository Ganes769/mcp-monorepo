import type { StandupData } from '../api/client'
import { GlassPanel } from './GlassPanel'

type Props = {
  data: StandupData | null
  loading: boolean
  error: string | null
  onRefresh: () => void
  onPost: () => void
  posting: boolean
}

const sections: { key: keyof StandupData['counts']; title: string }[] = [
  { key: 'blocked', title: 'Blocked' },
  { key: 'in_progress', title: 'In Progress' },
  { key: 'todo', title: 'To Do' },
  { key: 'done', title: 'Done' },
]

export function StandupView({
  data,
  loading,
  error,
  onRefresh,
  onPost,
  posting,
}: Props) {
  return (
    <div className="stack">
      <GlassPanel className="hero-panel">
        <div className="hero-row">
          <div>
            <p className="eyebrow">Daily pulse</p>
            <h1>Standup</h1>
            <p className="lede">
              Live Jira signal, grouped for Slack — refresh anytime or push to your
              channel.
            </p>
          </div>
          <div className="actions">
            <button type="button" className="btn ghost" onClick={onRefresh} disabled={loading}>
              {loading ? 'Loading…' : 'Refresh'}
            </button>
            <button type="button" className="btn primary" onClick={onPost} disabled={posting || loading}>
              {posting ? 'Posting…' : 'Post to Slack'}
            </button>
          </div>
        </div>

        {error && <p className="error-banner">{error}</p>}

        {data && (
          <div className="stat-row">
            {sections.map((section) => (
              <div key={section.key} className="stat glass-inset">
                <span>{section.title}</span>
                <strong>{data.counts[section.key]}</strong>
              </div>
            ))}
          </div>
        )}
      </GlassPanel>

      {data && (
        <div className="grid-2">
          {sections.map((section, index) => (
            <GlassPanel key={section.key} delay={0.05 * (index + 1)} className="list-panel">
              <div className="panel-head">
                <h2>{section.title}</h2>
                <span className="count-chip">{data.counts[section.key]}</span>
              </div>
              <ul className="issue-list">
                {data[section.key].length === 0 && (
                  <li className="empty">No items</li>
                )}
                {data[section.key].map((issue) => (
                  <li key={issue.key}>
                    <a href={issue.url} target="_blank" rel="noreferrer">
                      <strong>{issue.key}</strong>
                      <span>{issue.summary}</span>
                      <small>
                        {issue.assignee || 'Unassigned'} · {issue.status || '—'}
                      </small>
                    </a>
                  </li>
                ))}
              </ul>
            </GlassPanel>
          ))}
        </div>
      )}

      {data?.text && (
        <GlassPanel delay={0.25} className="preview-panel">
          <div className="panel-head">
            <h2>Slack preview</h2>
          </div>
          <pre className="standup-text">{data.text}</pre>
        </GlassPanel>
      )}
    </div>
  )
}
