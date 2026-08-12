type NavId = 'standup' | 'projects' | 'issues' | 'settings'

type Props = {
  active: NavId
  onChange: (id: NavId) => void
  projectKey: string
  healthy: boolean | null
}

const items: { id: NavId; label: string; hint: string }[] = [
  { id: 'standup', label: 'Standup', hint: 'Daily summary' },
  { id: 'projects', label: 'Projects', hint: 'Jira boards' },
  { id: 'issues', label: 'Issues', hint: 'Live backlog' },
  { id: 'settings', label: 'Settings', hint: 'Credentials' },
]

export function Sidebar({ active, onChange, projectKey, healthy }: Props) {
  return (
    <aside className="sidebar glass">
      <div className="brand">
        <span className="brand-mark" />
        <div>
          <p className="brand-name">WorkBridge</p>
          <p className="brand-sub">Ops dashboard</p>
        </div>
      </div>

      <nav className="nav">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`nav-item ${active === item.id ? 'active' : ''}`}
            onClick={() => onChange(item.id)}
          >
            <span>{item.label}</span>
            <small>{item.hint}</small>
          </button>
        ))}
      </nav>

      <div className="sidebar-foot">
        <div className="pill">
          <span className={`dot ${healthy ? 'ok' : healthy === false ? 'bad' : ''}`} />
          API {healthy ? 'online' : healthy === false ? 'offline' : '…'}
        </div>
        <div className="pill muted">Project {projectKey || '—'}</div>
      </div>
    </aside>
  )
}
