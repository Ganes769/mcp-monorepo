import type { Project } from '../api/client'
import { cx, theme } from '../theme'
import { PageTitle } from './PageTitle'

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
  const { classes } = theme

  return (
    <div>
      <header className={cx(classes.hero, 'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between')}>
        <PageTitle section="Projects" />
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className={cx('cursor-pointer px-3 py-1.5 text-[13px] font-medium disabled:opacity-50', classes.secondaryButton)}
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </header>

      <div className="space-y-5 px-8 py-6">
        {error && (
          <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] text-rose-700">
            {error}
          </p>
        )}

        <section className={cx(classes.panel, 'overflow-hidden rounded-lg')}>
          <ul>
            {projects.map((project) => {
              const selected = selectedKey === project.key
              return (
                <li key={project.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(project.key)}
                    className={cx(
                      classes.inset,
                      'flex w-full items-center justify-between text-left hover:bg-[#F8FAFC]',
                      selected && 'bg-[#F8FAFC]',
                    )}
                  >
                    <div>
                      <p className={cx('text-[13px]', classes.heading)}>{project.name}</p>
                      <p className={cx('mt-0.5', classes.muted)}>
                        {project.key} · {project.style || 'classic'}
                      </p>
                    </div>
                    {selected && <span className={classes.badge}>Active</span>}
                  </button>
                </li>
              )
            })}
            {!loading && projects.length === 0 && (
              <li className={cx('px-4 py-8 text-center', classes.muted)}>
                No projects returned. Check credentials in Settings.
              </li>
            )}
          </ul>
        </section>
      </div>
    </div>
  )
}
