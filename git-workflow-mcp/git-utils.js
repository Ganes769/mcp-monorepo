import { execFile } from "child_process";
import fs from "fs/promises";
import path from "path";
import { promisify } from "util";
import { getRepoPath } from "./config.js";

const execFileAsync = promisify(execFile);

export function resolveSafePath(relativePath) {
  const repoRoot = getRepoPath();
  const resolved = path.resolve(repoRoot, relativePath);

  if (resolved !== repoRoot && !resolved.startsWith(repoRoot + path.sep)) {
    throw new Error(`Path escapes repo root: ${relativePath}`);
  }

  return resolved;
}

export function validateBranchName(branch) {
  if (!/^[a-zA-Z0-9._\/-]+$/.test(branch)) {
    throw new Error(
      `Invalid branch name: ${branch}. Use letters, numbers, -, _, ., /`,
    );
  }
}

export async function runGit(args) {
  const repoRoot = getRepoPath();

  try {
    const { stdout, stderr } = await execFileAsync("git", args, {
      cwd: repoRoot,
      maxBuffer: 10 * 1024 * 1024,
    });

    return {
      stdout: stdout.trim(),
      stderr: stderr.trim(),
    };
  } catch (error) {
    const message =
      error.stderr?.toString().trim() ||
      error.stdout?.toString().trim() ||
      error.message;
    const err = new Error(message);
    err.exitCode = error.code;
    throw err;
  }
}

export async function writeRepoFile(relativePath, content) {
  const filePath = resolveSafePath(relativePath);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, "utf8");
  return filePath;
}

export async function getCurrentBranch() {
  const { stdout } = await runGit(["rev-parse", "--abbrev-ref", "HEAD"]);
  return stdout;
}
