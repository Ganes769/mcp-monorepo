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
}
