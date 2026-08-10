import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
  tone?: "default" | "teal" | "amber" | "sky" | "rose";
  className?: string;
}

const toneStyles = {
  default: "bg-secondary text-secondary-foreground",
  teal: "bg-accent text-accent-foreground",
  amber: "bg-amber-50 text-amber-800",
  sky: "bg-sky-50 text-sky-800",
  rose: "bg-rose-50 text-rose-800",
};

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "default",
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "dashboard-panel shadow-panel p-5 flex items-start justify-between gap-4",
        className,
      )}
    >
      <div className="min-w-0 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="text-3xl font-semibold tracking-tight tabular-nums">
          {value}
        </p>
        {hint ? (
          <p className="text-xs text-muted-foreground truncate">{hint}</p>
        ) : null}
      </div>
      {icon ? (
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            toneStyles[tone],
          )}
        >
          {icon}
        </div>
      ) : null}
    </div>
  );
}
