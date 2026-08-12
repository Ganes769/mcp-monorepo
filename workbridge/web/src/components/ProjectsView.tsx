import type { Project } from '../api/client'
import { GlassPanel } from './GlassPanel'

type Props = {
  projects: Project[]
  loading: boolean
  error: string | null
  selectedKey: string
  onSelect: (key: string) => void
  onRefresh: () => void
}

export function ProjectsView({
  projects,
  loading,
  error,
  selectedKey,
  onSelect,
  onRefresh,
}: Props) {
  return (
    <div className="stack">
      <GlassPanel className="hero-panel">
        <div className="hero-row">
          <div>
            <p className="eyebrow">Workspace</p>
            <h1>Projects</h1>
            <p className="lede">Choose a Jira project to drive standup and issue views.</p>
          </div>
          <button type="button" className="btn ghost" onClick={onRefresh} disabled={loading}>
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
        {error && <p className="error-banner">{error}</p>}
      </GlassPanel>

      <div className="project-grid">
        {projects.map((project, index) => (
          <GlassPanel key={project.id} delay={0.04 * index} className="project-card">
            <button
              type="button"
              className={`project-btn ${selectedKey === project.key ? 'selected' : ''}`}
              onClick={() => onSelect(project.key)}
            >
              <span className="project-key">{project.key}</span>
              <strong>{project.name}</strong>
              <small>{project.style || 'classic'}</small>
            </button>
          </GlassPanel>
        ))}
        {!loading && projects.length === 0 && (
          <GlassPanel>
            <p className="empty">No projects returned. Check credentials in Settings.</p>
          </GlassPanel>
        )}
      </div>
    </div>
  )
}
