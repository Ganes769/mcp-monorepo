import { useCallback, useEffect, useState } from 'react'
import { api, type Issue, type Project, type StandupData } from './api/client'
import { HomeView } from './components/HomeView'
import { IssuesView } from './components/IssuesView'
import { ProjectsView } from './components/ProjectsView'
import { SettingsView } from './components/SettingsView'
import { Sidebar } from './components/Sidebar'
import { StandupView } from './components/StandupView'
import { useCredentials } from './hooks/useCredentials'
import { cx, theme } from './theme'

type NavId = 'home' | 'standup' | 'projects' | 'issues' | 'settings'

export default function App() {
  const { credentials, update, clear } = useCredentials()
  const [nav, setNav] = useState<NavId>('home')
  const [projectKey, setProjectKey] = useState('KAN')
  const [healthy, setHealthy] = useState<boolean | null>(null)

  const [standup, setStandup] = useState<StandupData | null>(null)
  const [standupLoading, setStandupLoading] = useState(false)
  const [standupError, setStandupError] = useState<string | null>(null)
  const [posting, setPosting] = useState(false)

  const [projects, setProjects] = useState<Project[]>([])
  const [projectsLoading, setProjectsLoading] = useState(false)
  const [projectsError, setProjectsError] = useState<string | null>(null)

  const [issues, setIssues] = useState<Issue[]>([])
  const [issuesTotal, setIssuesTotal] = useState(0)
  const [issuesLoading, setIssuesLoading] = useState(false)
  const [issuesError, setIssuesError] = useState<string | null>(null)

  useEffect(() => {
    api
      .health()
      .then(() => setHealthy(true))
      .catch(() => setHealthy(false))
  }, [])

  const loadStandup = useCallback(async () => {
    setStandupLoading(true)
    setStandupError(null)
    try {
      const data = await api.getStandup(credentials, projectKey)
      setStandup(data)
    } catch (err) {
      setStandupError(err instanceof Error ? err.message : 'Failed to load standup')
    } finally {
      setStandupLoading(false)
    }
  }, [credentials, projectKey])

  const postStandup = useCallback(async () => {
    setPosting(true)
    setStandupError(null)
    try {
      const data = await api.postStandup(credentials, projectKey)
      setStandup((prev) =>
        prev
          ? { ...prev, text: data.text, counts: data.counts }
          : {
              projectKey: data.projectKey,
              jql: '',
              counts: data.counts,
              todo: [],
              in_progress: [],
              done: [],
              blocked: [],
              text: data.text,
            },
      )
    } catch (err) {
      setStandupError(err instanceof Error ? err.message : 'Failed to post standup')
    } finally {
      setPosting(false)
    }
  }, [credentials, projectKey])

  const loadProjects = useCallback(async () => {
    setProjectsLoading(true)
    setProjectsError(null)
    try {
      const data = await api.listProjects(credentials)
      setProjects(data)
    } catch (err) {
      setProjectsError(err instanceof Error ? err.message : 'Failed to load projects')
    } finally {
      setProjectsLoading(false)
    }
  }, [credentials])

  const loadIssues = useCallback(async () => {
    setIssuesLoading(true)
    setIssuesError(null)
    try {
      const data = await api.listIssues(credentials, projectKey)
      setIssues(data.issues)
      setIssuesTotal(data.total)
    } catch (err) {
      setIssuesError(err instanceof Error ? err.message : 'Failed to load issues')
    } finally {
      setIssuesLoading(false)
    }
  }, [credentials, projectKey])

  useEffect(() => {
    void loadProjects()
  }, [loadProjects])

  useEffect(() => {
    if (nav === 'standup') void loadStandup()
    if (nav === 'issues') void loadIssues()
  }, [nav, loadStandup, loadIssues])

  const projectName =
    projects.find((project) => project.key === projectKey)?.name || projectKey

  if (nav === 'home') {
    return (
      <HomeView
        onConnectOrg={() => setNav('settings')}
        onOpenApp={() => setNav('standup')}
      />
    )
  }

  return (
    <div className={cx('flex min-h-screen', theme.classes.page)}>
      <Sidebar
        active={nav}
        onChange={setNav}
        projectKey={projectKey}
        projectName={projectName}
        healthy={healthy}
      />
      <main className="min-w-0 flex-1">
        {nav === 'standup' && (
          <StandupView
            data={standup}
            loading={standupLoading}
            error={standupError}
            onRefresh={loadStandup}
            onPost={postStandup}
            posting={posting}
            projectName={projectName}
          />
        )}
        {nav === 'projects' && (
          <ProjectsView
            projects={projects}
            loading={projectsLoading}
            error={projectsError}
            selectedKey={projectKey}
            onSelect={(key) => {
              setProjectKey(key)
              setNav('standup')
            }}
            onRefresh={loadProjects}
          />
        )}
        {nav === 'issues' && (
          <IssuesView
            projectKey={projectKey}
            projectName={projectName}
            issues={issues}
            total={issuesTotal}
            loading={issuesLoading}
            error={issuesError}
            onRefresh={loadIssues}
          />
        )}
        {nav === 'settings' && (
          <SettingsView
            credentials={credentials}
            onChange={update}
            onClear={clear}
          />
        )}
      </main>
    </div>
  )
}
