import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  CircleDashed,
  Plus,
  Sparkles,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading";
import { ClaudeConnectGuide } from "@/components/common/ClaudeConnectGuide";
import { StatCard } from "@/components/common/StatCard";
import { IssueCard } from "@/components/issues";
import { useAuth } from "@/components/auth";
import { issuesApi } from "@/lib/api";
import { MCP_SERVER_URL } from "@/lib/config";
import type { Issue } from "@/types";

export default function HomePage() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setIssues([]);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await issuesApi.getIssues({ limit: 100, page: 1 });
        if (!cancelled) {
          setIssues(response.data || []);
        }
      } catch {
        if (!cancelled) {
          setError("Could not load dashboard metrics.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const stats = useMemo(() => {
    const total = issues.length;
    const notStarted = issues.filter((i) => i.status === "not_started").length;
    const inProgress = issues.filter((i) => i.status === "in_progress").length;
    const done = issues.filter((i) => i.status === "done").length;
    const urgentHigh = issues.filter(
      (i) => i.priority === "urgent" || i.priority === "high",
    ).length;
    return { total, notStarted, inProgress, done, urgentHigh };
  }, [issues]);

  const recentIssues = useMemo(() => issues.slice(0, 5), [issues]);

  if (authLoading) {
    return <LoadingState message="Loading dashboard..." />;
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="dashboard-panel shadow-panel overflow-hidden">
          <div className="grid gap-0 lg:grid-cols-[1.3fr_1fr]">
            <div className="space-y-5 p-8 sm:p-10">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                Issue Tracker
              </p>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                A calm operations dashboard for people and AI agents.
              </h1>
              <p className="max-w-xl text-muted-foreground">
                Track delivery work in a professional workspace, then connect
                Claude via MCP so agents can create, assign, and triage issues
                against your live API.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button asChild>
                  <Link to="/signin">Sign in to dashboard</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/signup">Create account</Link>
                </Button>
                <ClaudeConnectGuide variant="card" />
              </div>
            </div>
            <div className="border-t bg-secondary/60 p-8 lg:border-l lg:border-t-0 sm:p-10">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="h-4 w-4 text-primary" />
                AI skill surface
              </div>
              <p className="mb-4 text-sm text-muted-foreground">
                Remote MCP endpoint for Claude web, Desktop, and Cursor:
              </p>
              <code className="block break-all rounded-lg border bg-card p-3 font-mono text-xs">
                {MCP_SERVER_URL}
              </code>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Welcome back{user?.name ? `, ${user.name}` : ""}. Here’s your
            current issue pipeline.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/issues/new" className="gap-2">
              <Plus className="h-4 w-4" />
              New issue
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/issues">View all issues</Link>
          </Button>
        </div>
      </div>

      {error ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="pt-6 text-sm text-destructive">
            {error}
          </CardContent>
        </Card>
      ) : null}

      {loading ? (
        <LoadingState message="Loading metrics..." />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total issues"
              value={stats.total}
              hint="Loaded from your workspace"
              tone="teal"
              icon={<CircleDashed className="h-5 w-5" />}
            />
            <StatCard
              label="In progress"
              value={stats.inProgress}
              hint={`${stats.notStarted} not started`}
              tone="sky"
              icon={<AlertCircle className="h-5 w-5" />}
            />
            <StatCard
              label="Done"
              value={stats.done}
              hint="Closed in current page set"
              tone="default"
              icon={<CheckCircle2 className="h-5 w-5" />}
            />
            <StatCard
              label="High / urgent"
              value={stats.urgentHigh}
              hint="Needs attention"
              tone="amber"
              icon={<AlertCircle className="h-5 w-5" />}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            <Card className="shadow-panel border-0 dashboard-panel">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>Recent issues</CardTitle>
                  <CardDescription>
                    Latest items across your tracker
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/issues">Open board</Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentIssues.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      No issues yet. Create your first ticket to populate the
                      dashboard.
                    </p>
                    <Button className="mt-4" asChild>
                      <Link to="/issues/new">Create issue</Link>
                    </Button>
                  </div>
                ) : (
                  recentIssues.map((issue) => (
                    <IssueCard key={issue.id} issue={issue} />
                  ))
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="shadow-panel border-0 dashboard-panel">
                <CardHeader>
                  <CardTitle>Pipeline mix</CardTitle>
                  <CardDescription>Status distribution</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(
                    [
                      ["Not started", stats.notStarted, "bg-slate-400"],
                      ["In progress", stats.inProgress, "bg-sky-500"],
                      ["Done", stats.done, "bg-teal-600"],
                    ] as const
                  ).map(([label, count, color]) => {
                    const pct =
                      stats.total === 0
                        ? 0
                        : Math.round((count / stats.total) * 100);
                    return (
                      <div key={label} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{label}</span>
                          <span className="font-medium tabular-nums">
                            {count} · {pct}%
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-secondary">
                          <div
                            className={`h-full rounded-full ${color}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card className="shadow-panel border-0 dashboard-panel">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Claude / MCP
                  </CardTitle>
                  <CardDescription>
                    Let AI file and triage issues with your API key.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <code className="block break-all rounded-lg border bg-muted/50 p-3 font-mono text-xs">
                    {MCP_SERVER_URL}
                  </code>
                  <ClaudeConnectGuide variant="card" />
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
