import { useState } from "react";
import { Bot, Check, Copy, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GITHUB_REPO_URL, MCP_SERVER_URL } from "@/lib/config";
import { useToast } from "@/hooks/useToast";

const STEPS = [
  {
    title: "Open Claude settings",
    body: "Go to claude.ai → Settings → Connectors (or Customize → Connectors).",
  },
  {
    title: "Remove old connectors",
    body: "Delete any previous issue-tracker connector that still shows add / calculate tools.",
  },
  {
    title: "Add a custom connector",
    body: "Click + → Add custom connector. Use name issue-tracker-v2 and paste the MCP URL below.",
  },
  {
    title: "Connect & start a new chat",
    body: "Click Add / Connect. Open a brand-new chat so Claude picks up the latest tools.",
  },
  {
    title: "Create an issue with AI",
    body: 'Ask: Create an issue titled "…" with high priority. Use apiKey <paste from Copy API Key>.',
  },
] as const;

interface ClaudeConnectGuideProps {
  /** Render as a header button (default) or a larger home-page CTA */
  variant?: "header" | "card";
}

export function ClaudeConnectGuide({
  variant = "header",
}: ClaudeConnectGuideProps) {
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  const copyMcpUrl = async () => {
    try {
      await navigator.clipboard.writeText(MCP_SERVER_URL);
      setCopied(true);
      toast.success("MCP URL copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy URL");
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {variant === "card" ? (
          <Button className="gap-2">
            <Bot className="h-4 w-4" />
            Connect Claude — step by step
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="gap-2">
            <Bot className="h-4 w-4" />
            <span className="hidden sm:inline">Connect Claude</span>
            <span className="sm:hidden">Claude</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Connect Issue Tracker to Claude
          </DialogTitle>
          <DialogDescription>
            Step-by-step guide so Claude can create and manage issues via MCP
            (AI skill layer).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md border bg-muted/40 p-3 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              MCP server URL
            </p>
            <code className="block text-xs break-all font-mono">
              {MCP_SERVER_URL}
            </code>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="gap-2"
                onClick={copyMcpUrl}
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? "Copied" : "Copy URL"}
              </Button>
              <Button type="button" size="sm" variant="outline" asChild>
                <a
                  href="https://claude.ai/settings/connectors"
                  target="_blank"
                  rel="noreferrer"
                  className="gap-2"
                >
                  Open Claude Connectors
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Button>
            </div>
          </div>

          <ol className="space-y-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                  {index + 1}
                </span>
                <div className="min-w-0 pt-0.5">
                  <p className="text-sm font-medium">{step.title}</p>
                  <p className="text-sm text-muted-foreground">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="rounded-md border p-3 text-sm text-muted-foreground space-y-2">
            <p className="font-medium text-foreground">Tips</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Sign in here first, then use <strong>Copy API Key</strong> in the
                header when Claude asks for <code>apiKey</code>.
              </li>
              <li>
                If Claude still shows <code>add</code> / <code>calculate</code>,
                remove the old connector and add{" "}
                <code>issue-tracker-v2</code> again.
              </li>
              <li>
                Opening the MCP URL in a browser may show “Method not allowed” —
                that is normal for GET.
              </li>
            </ul>
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              GitHub: mcp-monorepo
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
