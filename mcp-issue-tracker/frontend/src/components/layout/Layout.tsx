import { useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Bot,
  CircleDot,
  LayoutDashboard,
  Menu,
  Plus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth, SignOutButton, ApiKeyCopyButton } from "@/components/auth";
import { ClaudeConnectGuide } from "@/components/common/ClaudeConnectGuide";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard, match: "exact" as const },
  { name: "Issues", href: "/issues", icon: CircleDot, match: "prefix" as const },
];

function isActive(pathname: string, href: string, match: "exact" | "prefix") {
  if (match === "exact") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { isAuthenticated, user, isLoading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const SidebarNav = (
    <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
      {navigation.map((item) => {
        const active = isActive(location.pathname, item.href, item.match);
        const Icon = item.icon;
        return (
          <Link
            key={item.name}
            to={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-white"
                : "text-sidebar-foreground/75 hover:bg-sidebar-muted hover:text-sidebar-foreground",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.name}
          </Link>
        );
      })}

      {isAuthenticated ? (
        <Link
          to="/issues/new"
          onClick={() => setMobileOpen(false)}
          className="mt-2 flex items-center gap-3 rounded-lg border border-white/10 px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-muted hover:text-sidebar-foreground"
        >
          <Plus className="h-4 w-4 shrink-0" />
          New issue
        </Link>
      ) : null}

      <div className="mt-auto space-y-3 border-t border-white/10 pt-4">
        <div className="rounded-lg bg-sidebar-muted/80 px-3 py-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-sidebar-foreground/60">
            <Bot className="h-3.5 w-3.5" />
            AI / MCP
          </div>
          <p className="mb-3 text-xs leading-relaxed text-sidebar-foreground/65">
            Connect Claude so agents can create and triage issues.
          </p>
          <div className="[&_button]:w-full [&_button]:justify-center [&_button]:border-white/15 [&_button]:bg-transparent [&_button]:text-sidebar-foreground [&_button:hover]:bg-sidebar-muted">
            <ClaudeConnectGuide />
          </div>
        </div>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile overlay */}
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform duration-200 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
          <Link
            to="/"
            className="flex items-center gap-2 font-semibold tracking-tight"
            onClick={() => setMobileOpen(false)}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-sidebar-accent text-sm font-bold text-white">
              IT
            </span>
            <span>Issue Tracker</span>
          </Link>
          <button
            type="button"
            className="rounded-md p-1 text-sidebar-foreground/70 hover:bg-sidebar-muted lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {SidebarNav}
      </aside>

      {/* Main column */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b bg-card/90 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="rounded-md border p-2 text-foreground lg:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-foreground">
                  {location.pathname.startsWith("/issues")
                    ? "Issues workspace"
                    : "Operations dashboard"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Track delivery work and AI-assisted triage
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isLoading ? (
                <div className="animate-pulse text-sm text-muted-foreground">
                  Loading...
                </div>
              ) : isAuthenticated && user ? (
                <>
                  <div className="mr-1 hidden text-right md:block">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                  <ApiKeyCopyButton />
                  <SignOutButton />
                </>
              ) : (
                <>
                  <Button variant="ghost" asChild>
                    <Link to="/signin">Sign In</Link>
                  </Button>
                  <Button asChild>
                    <Link to="/signup">Sign Up</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100vh-4rem)] px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
