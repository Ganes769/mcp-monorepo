import { useCallback, useEffect, useState } from "react";
import {
  api,
  type Issue,
  type JiraConnection,
  type Project,
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
  const [nav, setNav] = useState<NavId>("home");
  const [healthy, setHealthy] = useState<boolean | null>(null);
  const [jira, setJira] = useState<JiraConnection>({ connected: false });

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
    } catch {
      setJira({ connected: false });
    }
  }, []);

  useEffect(() => {
    api
      .health()
      .then(() => setHealthy(true))
      .catch(() => setHealthy(false));
    void loadConnection();

    const params = new URLSearchParams(window.location.search);
    if (params.get("jira") === "connected") {
      setNav("settings");
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
      setStandup((prev) =>
        prev
          ? { ...prev, text: data.text, counts: data.counts }
          : {
              projectKey: data.projectKey,
              jql: "",
              counts: data.counts,
              todo: [],
              in_progress: [],
              done: [],
              blocked: [],
              text: data.text,
            },
      );
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
    } catch (err) {
      setProjectsError(
        err instanceof Error ? err.message : "Failed to load projects",
      );
    } finally {
      setProjectsLoading(false);
    }
  }, [jira.connected]);

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
            onOpenApp={() => setNav(jira.connected ? "standup" : "settings")}
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
            onDisconnected={() => {
              setJira({ connected: false });
              setProjectKey("");
              setProjects([]);
            }}
          />
        )}
      </main>
    </div>
  );
}
