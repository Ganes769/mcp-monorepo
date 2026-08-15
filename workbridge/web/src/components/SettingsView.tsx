import { cx, theme } from "../theme";
import { PageTitle } from "./PageTitle";
import type { JiraConnection } from "../api/client";
import { api } from "../api/client";

type Props = {
  jira: JiraConnection;
  onDisconnected: () => void;
};

export function SettingsView({ jira, onDisconnected }: Props) {
  const { classes } = theme;

  return (
    <div>
      <header className={classes.hero}>
        <PageTitle section="Connect your org" />
      </header>

      <div className="max-w-xl space-y-5 px-8 py-6">
        <p className={classes.body}>
          Sign in with Atlassian. WorkBridge uses Jira OAuth — no API token is
          stored in this browser.
        </p>

        <section className={cx(classes.panel, "space-y-4 rounded-lg p-5")}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className={cx("text-[15px]", classes.heading)}>Jira</p>
              <p className={cx("mt-1", classes.muted)}>
                {jira.connected
                  ? `${jira.siteName || "Atlassian site"} · ${jira.siteUrl || "Connected"}`
                  : "Not connected"}
              </p>
            </div>
            <span
              className={cx(
                "mt-0.5 h-2 w-2 shrink-0 rounded-full",
                jira.connected ? "bg-emerald-500" : "bg-slate-300",
              )}
            />
          </div>

          {jira.connected ? (
            <button
              type="button"
              onClick={async () => {
                await api.oauthDisconnect();
                onDisconnected();
              }}
              className={cx(
                "px-3 py-1.5 text-[13px] font-semibold",
                classes.secondaryButton,
              )}
            >
              Disconnect Jira
            </button>
          ) : (
            <a
              href={api.jiraConnectUrl()}
              className={cx(
                "inline-flex cursor-pointer items-center justify-center px-4 py-2 text-[13px] font-semibold",
                classes.primaryButton,
              )}
            >
              Connect Jira
            </a>
          )}
        </section>
      </div>
    </div>
  );
}
