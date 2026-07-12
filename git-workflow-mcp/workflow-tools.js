import { z } from "zod";
import { getRepoPath } from "./config.js";
import {
  getCurrentBranch,
  runGit,
  validateBranchName,
  writeRepoFile,
} from "./git-utils.js";

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
            exitCode: error.exitCode ?? null,
          },
          null,
          2,
        ),
      },
    ],
    isError: true,
  };
}

export default function registerWorkflowTools(server) {
  server.registerTool(
    "write_file",
    {
      title: "Write File",
      description:
        "Create or overwrite a file in the repo with the given content",
      inputSchema: {
        file_path: z
          .string()
          .describe("Relative path inside the repo, e.g. src/utils.js"),
        content: z.string().describe("Full file content to write"),
      },
    },
    async ({ file_path, content }) => {
      try {
        const absolutePath = await writeRepoFile(file_path, content);
        return toolResponse({
          success: true,
          file_path,
          absolute_path: absolutePath,
          bytes_written: Buffer.byteLength(content, "utf8"),
        });
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "create_branch",
    {
      title: "Create Branch",
      description: "Create and checkout a new git branch",
      inputSchema: {
        branch_name: z.string().describe("New branch name"),
        base_branch: z
          .string()
          .optional()
          .describe("Optional base branch. Defaults to current branch"),
      },
    },
    async ({ branch_name, base_branch }) => {
      try {
        validateBranchName(branch_name);

        if (base_branch) {
          validateBranchName(base_branch);
          await runGit(["checkout", base_branch]);
        }

        const result = await runGit(["checkout", "-b", branch_name]);

        return toolResponse({
          success: true,
          branch: branch_name,
          base_branch: base_branch ?? "current HEAD",
          output: result.stdout,
        });
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "commit_and_push",
    {
      title: "Commit and Push",
      description: "Stage files, commit, and push to remote",
      inputSchema: {
        message: z.string().describe("Commit message"),
        files: z
          .array(z.string())
          .optional()
          .describe(
            "Relative file paths to stage. Defaults to all changes (git add -A)",
          ),
        remote: z.string().optional().describe('Remote name, default "origin"'),
        branch: z
          .string()
          .optional()
          .describe("Branch to push. Defaults to current branch"),
      },
    },
    async ({ message, files, remote, branch }) => {
      try {
        const targetRemote = remote ?? "origin";
        const targetBranch = branch ?? (await getCurrentBranch());

        validateBranchName(targetBranch);

        if (files?.length) {
          await runGit(["add", "--", ...files]);
        } else {
          await runGit(["add", "-A"]);
        }

        const commit = await runGit(["commit", "-m", message]);
        const push = await runGit([
          "push",
          "-u",
          targetRemote,
          targetBranch,
        ]);

        return toolResponse({
          success: true,
          branch: targetBranch,
          remote: targetRemote,
          commit_output: commit.stdout,
          push_output: push.stdout,
        });
      } catch (error) {
        return toolError(error);
      }
    },
  );
}
