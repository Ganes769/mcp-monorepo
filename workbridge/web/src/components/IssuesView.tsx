import type { Issue } from '../api/client'
import { GlassPanel } from './GlassPanel'

type Props = {
  projectKey: string
  issues: Issue[]
  total: number
  loading: boolean
  error: string | null
  onRefresh: () => void
}

export function IssuesView({
  projectKey,
  issues,
  total,
  loading,
  error,
  onRefresh,
}: Props) {
  return (
    <div className="stack">
      <GlassPanel className="hero-panel">
        <div className="hero-row">
          <div>
            <p className="eyebrow">{projectKey || 'Project'}</p>
            <h1>Issues</h1>
            <p className="lede">
              {total} issue{total === 1 ? '' : 's'} from Jira, ordered for the board.
            </p>
          </div>
          <button type="button" className="btn ghost" onClick={onRefresh} disabled={loading}>
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
        {error && <p className="error-banner">{error}</p>}
      </GlassPanel>

      <GlassPanel delay={0.08} className="list-panel wide">
        <ul className="issue-table">
          {issues.map((issue) => (
            <li key={issue.key}>
              <a href={issue.url} target="_blank" rel="noreferrer">
                <span className="key">{issue.key}</span>
                <span className="summary">{issue.summary}</span>
                <span className="meta">{issue.status || '—'}</span>
                <span className="meta">{issue.assignee || 'Unassigned'}</span>
                <span className="meta">{issue.priority || '—'}</span>
              </a>
            </li>
          ))}
          {!loading && issues.length === 0 && (
            <li className="empty">No issues for this project.</li>
          )}
        </ul>
      </GlassPanel>
    </div>
  )
}
