import { useCallback, useEffect, useState } from "react";
import {
  API_BASE,
  api,
  type Issue,
  type JiraConnection,
  type Project,
  type SlackConnection,
  type StandupData,
} from "./api/client";
import { HomeView } from "./components/HomeView";
import { IssuesView } from "./components/IssuesView";
import { ProjectsView } from "./components/ProjectsView";
import { SettingsView } from "./components/SettingsView";
import { Sidebar } from "./components/Sidebar";
import { StandupView } from "./components/StandupView";
import { useSelectedProject } from "./hooks/useCredentials";
import { cx, theme } from "./theme";

type NavId = "home" | "standup" | "projects" | "issues" | "settings";

export default function App() {
  const { projectKey, setProjectKey } = useSelectedProject();
  const [nav, setNav] = useState<NavId>("standup");
  const [healthy, setHealthy] = useState<boolean | null>(null);
  const [jira, setJira] = useState<JiraConnection>({ connected: false });
  const [slack, setSlack] = useState<SlackConnection>({ connected: false });
  const [slackError, setSlackError] = useState<string | null>(null);

  const [standup, setStandup] = useState<StandupData | null>(null);
  const [standupLoading, setStandupLoading] = useState(false);
  const [standupError, setStandupError] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);

  const [issues, setIssues] = useState<Issue[]>([]);
  const [issuesTotal, setIssuesTotal] = useState(0);
  const [issuesLoading, setIssuesLoading] = useState(false);
  const [issuesError, setIssuesError] = useState<string | null>(null);

  const loadConnection = useCallback(async () => {
    try {
      const data = await api.oauthStatus();
      setJira(data.jira);
      setSlack(data.slack || { connected: false });
      if (!projectKey && data.projectKey) {
        setProjectKey(data.projectKey);
      }
    } catch {
      setJira({ connected: false });
      setSlack({ connected: false });
    }
  }, [projectKey, setProjectKey]);

  useEffect(() => {
    if (projectKey) void api.saveWorkspace(projectKey);
  }, [projectKey]);

  useEffect(() => {
    if (window.location.pathname === "/oauth/slack/callback") {
      window.location.replace(`${API_BASE}/oauth/slack/callback${window.location.search}`);
      return;
    }

    api
      .health()
      .then(() => setHealthy(true))
      .catch(() => setHealthy(false));
    void loadConnection();

    const params = new URLSearchParams(window.location.search);
    if (params.get("jira") === "connected" || params.get("slack") === "connected") {
      setNav("settings");
      window.history.replaceState({}, "", window.location.pathname);
    }
    if (params.get("slack") === "error") {
      setNav("settings");
      setSlackError(params.get("reason") || "Slack connection failed");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [loadConnection]);

  const loadStandup = useCallback(async () => {
    if (!projectKey) {
      setStandup(null);
      setStandupError("Select a Jira project first");
      return;
    }
    setStandupLoading(true);
    setStandupError(null);
    try {
      const data = await api.getStandup(projectKey);
      setStandup(data);
    } catch (err) {
      setStandupError(
        err instanceof Error ? err.message : "Failed to load standup",
      );
    } finally {
      setStandupLoading(false);
    }
  }, [projectKey]);

  const postStandup = useCallback(async () => {
    if (!projectKey) return;
    setPosting(true);
    setStandupError(null);
    try {
      const data = await api.postStandup(projectKey);
      setStandup(data);
    } catch (err) {
      setStandupError(
        err instanceof Error ? err.message : "Failed to post standup",
      );
    } finally {
      setPosting(false);
    }
  }, [projectKey]);

  const loadProjects = useCallback(async () => {
    if (!jira.connected) {
      setProjects([]);
      return;
    }
    setProjectsLoading(true);
    setProjectsError(null);
    try {
      const data = await api.listProjects();
      setProjects(data);
      if (data[0]?.key) {
        setProjectKey((current) => current || data[0].key);
      }
    } catch (err) {
      setProjectsError(
        err instanceof Error ? err.message : "Failed to load projects",
      );
    } finally {
      setProjectsLoading(false);
    }
  }, [jira.connected, setProjectKey]);

  const loadIssues = useCallback(async () => {
    if (!projectKey) {
      setIssues([]);
      setIssuesError("Select a Jira project first");
      return;
    }
    setIssuesLoading(true);
    setIssuesError(null);
    try {
      const data = await api.listIssues(projectKey);
      setIssues(data.issues);
      setIssuesTotal(data.total);
    } catch (err) {
      setIssuesError(
        err instanceof Error ? err.message : "Failed to load issues",
      );
    } finally {
      setIssuesLoading(false);
    }
  }, [projectKey]);

  useEffect(() => {
    if (jira.connected) void loadProjects();
  }, [jira.connected, loadProjects]);

  useEffect(() => {
    if (nav === "standup") void loadStandup();
    if (nav === "issues") void loadIssues();
  }, [nav, loadStandup, loadIssues]);

  const projectName =
    projects.find((project) => project.key === projectKey)?.name || projectKey;
  const orgReady = jira.connected && slack.connected;

  if (!orgReady) {
    if (nav === "settings") {
      return (
        <SettingsView
          jira={jira}
          slack={slack}
          slackError={slackError}
          onJiraDisconnected={() => {
            setJira({ connected: false });
            setProjectKey("");
            setProjects([]);
            setNav("settings");
          }}
          onSlackDisconnected={() => {
            setSlack({ connected: false });
            setNav("settings");
          }}
          onOpenApp={() => setNav("standup")}
          onBackHome={() => setNav("home")}
        />
      );
    }

    return (
      <HomeView
        onConnectOrg={() => setNav("settings")}
        onOpenApp={() => setNav("settings")}
      />
    );
  }

  return (
    <div className={cx("flex min-h-screen flex-col md:flex-row", theme.classes.page)}>
      <Sidebar
        active={nav}
        onChange={setNav}
        projectKey={projectKey}
        projectName={projectName}
        healthy={healthy}
      />
      <main className="min-w-0 flex-1">
        {nav === "home" && (
          <HomeView
            onConnectOrg={() => setNav("settings")}
            onOpenApp={() => setNav("standup")}
          />
        )}
        {nav === "standup" && (
          <StandupView
            data={standup}
            loading={standupLoading}
            error={standupError}
            onRefresh={loadStandup}
            onPost={postStandup}
            posting={posting}
            projectName={projectName}
            projectKey={projectKey}
            slackConnected={slack.connected}
          />
        )}
        {nav === "projects" && (
          <ProjectsView
            projects={projects}
            loading={projectsLoading}
            error={projectsError}
            selectedKey={projectKey}
            onSelect={(key) => {
              setProjectKey(key);
              void api.saveWorkspace(key);
              setNav("standup");
            }}
            onRefresh={loadProjects}
          />
        )}
        {nav === "issues" && (
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
        {nav === "settings" && (
          <SettingsView
            jira={jira}
            slack={slack}
            slackError={slackError}
            onJiraDisconnected={() => {
              setJira({ connected: false });
              setProjectKey("");
              setProjects([]);
              setNav("settings");
            }}
            onSlackDisconnected={() => {
              setSlack({ connected: false });
              setNav("settings");
            }}
            onOpenApp={() => setNav("standup")}
            onBackHome={() => setNav("home")}
          />
        )}
      </main>
    </div>
  );
}
