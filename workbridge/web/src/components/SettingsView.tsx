import type { JiraConnection, SlackConnection } from "../api/client";
import { api } from "../api/client";

type Props = {
  jira: JiraConnection;
  slack: SlackConnection;
  slackError?: string | null;
  onJiraDisconnected: () => void;
  onSlackDisconnected: () => void;
  onOpenApp?: () => void;
  onBackHome?: () => void;
};

export function SettingsView({
  jira,
  slack,
  slackError,
  onJiraDisconnected,
  onSlackDisconnected,
  onOpenApp,
  onBackHome,
}: Props) {
  const doneCount = Number(jira.connected) + Number(slack.connected);
  const progress = (doneCount / 2) * 100;
  const ready = jira.connected && slack.connected;

  return (
    <div className="min-h-screen bg-[#06122e] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(37,99,235,0.28),transparent_46%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_90%_20%,rgba(56,189,248,0.12),transparent_40%)]" />

      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col px-5 py-8 sm:px-8 sm:py-12">
        <div className="mb-10 flex items-center justify-between">
          <p className="font-display text-lg font-semibold tracking-tight">WorkBridge</p>
          {onBackHome && (
            <button
              type="button"
              onClick={onBackHome}
              className="cursor-pointer rounded-lg px-3 py-2 text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white"
            >
              Back to home
            </button>
          )}
        </div>

        <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-sky-300">
          Workspace setup
        </p>
        <h1 className="font-display max-w-2xl text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
          Connect Jira and Slack in two steps.
        </h1>
        <p className="mt-4 max-w-xl text-[16px] leading-7 text-slate-300">
          Authorize each tool once. WorkBridge reads the live board and posts
          the standup. Nothing is stored in this browser.
        </p>

        <div className="mt-10 max-w-xl">
          <div className="mb-2 flex items-center justify-between text-[13px] font-semibold">
            <span className="text-slate-300">{doneCount} of 2 connected</span>
            <span className="tabular-nums text-sky-200">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-sky-400 transition-all duration-500"
              style={{ width: `${Math.max(progress, 6)}%` }}
            />
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
          <ConnectionCard
            step="01"
            name="Jira"
            title="Atlassian Jira"
            description="Read projects, issues, and the daily board."
            connected={jira.connected}
            detail={
              jira.connected
                ? `${jira.siteName || "Jira site"}${jira.siteUrl ? ` · ${jira.siteUrl}` : ""}`
                : "Waiting for Atlassian approval"
            }
            actionLabel={jira.connected ? "Disconnect Jira" : "Connect Jira"}
            actionHref={jira.connected ? undefined : api.jiraConnectUrl()}
            onAction={
              jira.connected
                ? async () => {
                    await api.oauthDisconnect("jira");
                    onJiraDisconnected();
                  }
                : undefined
            }
          />

          <ConnectionCard
            step="02"
            name="Slack"
            title="Slack workspace"
            description="Post the standup to your team channel."
            connected={slack.connected}
            error={slackError}
            detail={
              slack.connected
                ? `${slack.teamName || "Slack workspace"}${slack.channelId ? ` · ${slack.channelId}` : ""}`
                : "Waiting for Slack install"
            }
            actionLabel={slack.connected ? "Disconnect Slack" : "Connect Slack"}
            actionHref={slack.connected ? undefined : api.slackConnectUrl()}
            onAction={
              slack.connected
                ? async () => {
                    await api.oauthDisconnect("slack");
                    onSlackDisconnected();
                  }
                : undefined
            }
          />
        </div>

        {ready && (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <p className="font-display text-xl font-semibold">Workspace ready</p>
            <p className="mt-2 text-[15px] leading-6 text-slate-300">
              Both tools are connected. Open standup to brief the team.
            </p>
            {onOpenApp && (
              <button
                type="button"
                onClick={onOpenApp}
                className="mt-5 cursor-pointer rounded-lg bg-white px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-slate-100"
              >
                Open standup
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ConnectionCard({
  step,
  name,
  title,
  description,
  connected,
  detail,
  error,
  actionLabel,
  actionHref,
  onAction,
}: {
  step: string;
  name: string;
  title: string;
  description: string;
  connected: boolean;
  detail: string;
  error?: string | null;
  actionLabel: string;
  actionHref?: string;
  onAction?: () => Promise<void>;
}) {
  return (
    <section className="flex flex-col rounded-3xl border border-white/10 bg-white p-6 text-slate-950 shadow-[0_24px_60px_rgba(2,8,23,0.28)] sm:p-7">
      <div className="mb-6 flex items-center justify-between">
        <span className="text-[12px] font-semibold tracking-[0.16em] text-blue-700">
          {step} · {name}
        </span>
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            connected ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
          }`}
        >
          {connected ? "Connected" : "Not connected"}
        </span>
      </div>

      <h2 className="font-display text-2xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-2 text-[15px] leading-6 text-slate-600">{description}</p>
      <p className="mt-4 text-[13px] text-slate-500">{detail}</p>
      {error && (
        <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-[13px] text-rose-700">{error}</p>
      )}

      <div className="mt-8 flex flex-1 items-end">
        {actionHref ? (
          <a
            href={actionHref}
            className="inline-flex w-full cursor-pointer items-center justify-center rounded-xl bg-blue-600 px-5 py-3.5 text-[15px] font-semibold text-white shadow-[0_12px_30px_rgba(37,99,235,0.28)] hover:bg-blue-500"
          >
            {actionLabel}
          </a>
        ) : (
          <button
            type="button"
            onClick={() => void onAction?.()}
            className="inline-flex w-full cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-[15px] font-semibold text-slate-700 hover:bg-slate-50"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </section>
  );
}
