import { cx, theme } from "../theme";
import {
  IconHome,
  IconIssues,
  IconProjects,
  IconSettings,
  IconStandup,
} from "./icons";

type NavId = "home" | "standup" | "projects" | "issues" | "settings";

type Props = {
  active: NavId;
  onChange: (id: NavId) => void;
  projectKey: string;
  projectName: string;
  healthy: boolean | null;
};

const items: { id: NavId; label: string; icon: typeof IconStandup }[] = [
  { id: "home", label: "Home", icon: IconHome },
  { id: "standup", label: "Standup", icon: IconStandup },
  { id: "projects", label: "Projects", icon: IconProjects },
  { id: "issues", label: "Issues", icon: IconIssues },
  { id: "settings", label: "Connect org", icon: IconSettings },
];

export function Sidebar({
  active,
  onChange,
  projectKey,
  projectName,
  healthy,
}: Props) {
  const { classes } = theme;

  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-[#E2E8F0] bg-white md:w-[232px] md:border-b-0 md:border-r">
      <div className="flex items-center gap-2.5 border-b border-[#E2E8F0] px-5 py-4">
        <span className={cx("h-6 w-6 rounded-[5px]", classes.accent)} />
        <div>
          <p className={cx("text-[13px]", classes.heading)}>WorkBridge</p>
          <p className={classes.muted}>Jira operations</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        {items.map((item) => {
          const selected = active === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className={cx(
                "flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] font-semibold transition",
                selected
                  ? "bg-[#F1F5F9] text-[#0F172A]"
                  : "text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="space-y-2 border-t border-[#E2E8F0] px-5 py-4">
        <div className="flex items-center gap-2">
          <span
            className={cx(
              "h-1.5 w-1.5 rounded-full",
              healthy
                ? "bg-emerald-500"
                : healthy === false
                  ? "bg-rose-500"
                  : "bg-slate-300",
            )}
          />
          <span className={classes.muted}>
            {healthy
              ? "API connected"
              : healthy === false
                ? "API offline"
                : "Connecting"}
          </span>
        </div>
        <p className={cx("truncate", classes.muted)}>
          {projectKey
            ? `${projectName} (${projectKey})`
            : "No project selected"}
        </p>
      </div>
    </aside>
  );
}
