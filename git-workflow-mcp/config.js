import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function getRepoPath() {
  const repoPath = process.env.REPO_PATH ?? path.resolve(__dirname, "..");
  return path.resolve(repoPath);
}
