import type { JiraCredentials } from '../api/client'
import { cx, theme } from '../theme'
import { PageTitle } from './PageTitle'

type Props = {
  credentials: JiraCredentials
  onChange: (patch: Partial<JiraCredentials>) => void
  onClear: () => void
}

export function SettingsView({ credentials, onChange, onClear }: Props) {
  const { classes } = theme

  return (
    <div>
      <header className={classes.hero}>
        <PageTitle section="Settings" />
      </header>

      <div className="max-w-lg space-y-5 px-8 py-6">
        <p className={classes.body}>
          Credentials stay in this browser and are sent as Jira headers. Leave blank to
          use the server environment.
        </p>

        <section className={cx(classes.panel, 'space-y-4 rounded-lg p-5')}>
          <label className={cx('grid gap-1.5', classes.muted)}>
            Jira email
            <input
              type="email"
              value={credentials.email}
              onChange={(e) => onChange({ email: e.target.value })}
              placeholder="you@company.com"
              autoComplete="username"
              className={cx('px-3 py-2 text-[14px]', classes.input)}
            />
          </label>
          <label className={cx('grid gap-1.5', classes.muted)}>
            API token
            <input
              type="password"
              value={credentials.token}
              onChange={(e) => onChange({ token: e.target.value })}
              placeholder="Atlassian API token"
              autoComplete="current-password"
              className={cx('px-3 py-2 text-[14px]', classes.input)}
            />
          </label>
          <label className={cx('grid gap-1.5', classes.muted)}>
            Base URL
            <input
              type="url"
              value={credentials.baseUrl}
              onChange={(e) => onChange({ baseUrl: e.target.value })}
              placeholder="https://your-site.atlassian.net"
              className={cx('px-3 py-2 text-[14px]', classes.input)}
            />
          </label>
          <button
            type="button"
            onClick={onClear}
            className={cx('px-3 py-1.5 text-[13px] font-medium', classes.secondaryButton)}
          >
            Clear saved
          </button>
        </section>
      </div>
    </div>
  )
}
