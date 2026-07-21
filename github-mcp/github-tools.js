import { z } from "zod";
import { resolveRepo } from "./config.js";
import { githubRequest, getRepoPath } from "./client.js";

const repoParams = {
  owner: z.string().optional(),
  repo: z.string().optional(),
};

function toolResponse(result) {
  return {
    content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
  };
}

function toolError(error) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            error: error.message,
            status: error.status ?? null,
            details: error.data ?? null,
          },
          null,
          2,
        ),
      },
    ],
    isError: true,
  };
}

export default function registerGithubTools(server) {
  server.registerTool(
    "create_pull_request",
    {
      title: "Create pull request",
      description: "Create a pull request in this repository",
      inputSchema: {
        title: z.string().describe("Pr title"),
        head: z.string().describe("source branch"),
        base: z.string().describe("Target brnch"),
        body: z.string().optional().describe("pr description"),
        draft: z.boolean().optional().describe("Create as draft PR"),
        ...repoParams,
      },
    },
    async (params) => {
      try {
        const { owner, repo, title, head, base, body, draft } = params;
        const { owner: o, repo: r } = resolveRepo({ owner, repo });
        const result = await githubRequest(
          "POST",
          getRepoPath(o, r, "/pulls"),
          {
            body: { title, head, base, body, draft },
          },
        );
        return toolResponse(result);
      } catch (error) {
        return toolError(error);
      }
    },
  );
  server.registerTool(
    "list_pull_requests",
    {
      title: "List Pull Requests",
      description: "List pull requests",
      inputSchema: {
        state: z.enum(["open", "closed", "all"]).optional(),
        per_page: z.number().optional(),
        ...repoParams,
      },
    },
    async (params) => {
      try {
        const { owner, repo, state, per_page } = params;
        const { owner: o, repo: r } = resolveRepo({ owner, repo });
        const result = await githubRequest("GET", getRepoPath(o, r, "/pulls"), {
          query: { state: state ?? "open", per_page: per_page ?? 30 },
        });
        return toolResponse(result);
      } catch (e) {
        return toolError(e);
      }
    },
  );
  server.registerTool(
    "create_issue",
    {
      title: "Create issue",
      description: "create a new issue in  the repository",
      inputSchema: {
        title: z.string().describe("issue title"),
        body: z.string().optional().describe("issue body"),
        labels: z.array(z.string()).optional().describe("Label names"),
        assignees: z.array(z.string()).optional().describe("GitHub usernames"),
        ...repoParams,
      },
    },
    async (params) => {
      try {
        const { owner, repo, title, body, labels, assignees } = params;
        const { owner: o, repo: r } = resolveRepo({ owner, repo });
        const result = await githubRequest(
          "POST",
          getRepoPath(o, r, "/issues"),
          {
            body: { title, body, labels, assignees },
          },
        );
        return toolResponse(result);
      } catch (error) {
        return toolError(error);
      }
    },
  );
  server.registerTool(
    "get_issue",
    {
      title: "Get Issue",
      description: "Get details for a specific issue",
      inputSchema: {
        issue_number: z.number().describe("Issue number"),
        ...repoParams,
      },
    },
    async (params) => {
      try {
        const { owner, repo, issue_number } = params;
        const { owner: o, repo: r } = resolveRepo({ owner, repo });
        const result = await githubRequest(
          "GET",
          getRepoPath(o, r, `/issues/${issue_number}`),
        );
        return toolResponse(result);
      } catch (error) {
        return toolError(error);
      }
    },
  );
  server.registerTool(
    "list_branches",
    {
      title: "List Branches",
      description: "List branches in the repository",
      inputSchema: {
        per_page: z.number().optional().describe("Results per page (max 100)"),
        ...repoParams,
      },
    },
    async (params) => {
      try {
        const { owner, repo, per_page } = params;
        const { owner: o, repo: r } = resolveRepo({ owner, repo });
        const result = await githubRequest(
          "GET",
          getRepoPath(o, r, "/branches"),
          {
            query: {
              per_page: per_page ?? 30,
            },
          },
        );
        return toolResponse(result);
      } catch (error) {
        return toolError(error);
      }
    },
  );
}
