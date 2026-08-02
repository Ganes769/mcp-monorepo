import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClaudeConnectGuide } from "@/components/common/ClaudeConnectGuide";
import { Link } from "react-router-dom";
import { MCP_SERVER_URL } from "@/lib/config";

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Welcome to Issue Tracker</CardTitle>
          <CardDescription>
            Manage issues in the UI — or let Claude / Cursor do it through MCP.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Start by viewing your issues, or open the Claude guide to connect AI
            so it can create, assign, and prioritize tickets for you.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link to="/issues">View issues</Link>
            </Button>
            <ClaudeConnectGuide variant="card" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI + MCP</CardTitle>
          <CardDescription>
            Remote Issue Tracker MCP for Claude web, Claude Desktop, and Cursor.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Tools include <code>create_issue</code>, <code>list_issues</code>,
            assign, priority, and tags — against your live API. Use{" "}
            <strong>Connect Claude</strong> in the header or above for the full
            step-by-step popup guide.
          </p>
          <code className="block text-xs break-all rounded-md border bg-muted/40 p-3 font-mono">
            {MCP_SERVER_URL}
          </code>
        </CardContent>
      </Card>
    </div>
  );
}
