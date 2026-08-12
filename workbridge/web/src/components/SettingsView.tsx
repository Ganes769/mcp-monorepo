import type { JiraCredentials } from '../api/client'
import { GlassPanel } from './GlassPanel'

type Props = {
  credentials: JiraCredentials
  onChange: (patch: Partial<JiraCredentials>) => void
  onClear: () => void
}

export function SettingsView({ credentials, onChange, onClear }: Props) {
  return (
    <div className="stack">
      <GlassPanel className="hero-panel">
        <p className="eyebrow">Access</p>
        <h1>Settings</h1>
        <p className="lede">
          Credentials stay in your browser (localStorage) and are sent as Jira headers
          per request. Leave blank to use the server env fallback.
        </p>
      </GlassPanel>

      <GlassPanel delay={0.08} className="form-panel">
        <label>
          Jira email
          <input
            type="email"
            value={credentials.email}
            onChange={(e) => onChange({ email: e.target.value })}
            placeholder="you@company.com"
            autoComplete="username"
          />
        </label>
        <label>
          API token
          <input
            type="password"
            value={credentials.token}
            onChange={(e) => onChange({ token: e.target.value })}
            placeholder="Atlassian API token"
            autoComplete="current-password"
          />
        </label>
        <label>
          Base URL
          <input
            type="url"
            value={credentials.baseUrl}
            onChange={(e) => onChange({ baseUrl: e.target.value })}
            placeholder="https://your-site.atlassian.net"
          />
        </label>
        <div className="actions">
          <button type="button" className="btn ghost" onClick={onClear}>
            Clear saved
          </button>
        </div>
      </GlassPanel>
    </div>
  )
}
