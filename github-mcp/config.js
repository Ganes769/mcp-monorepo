export function getToken() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error("Github token is required");
  }
  return token;
}
export function resolveRepo({ owner, repo } = {}) {
  const resolvedOwner = owner ?? process.env.GITHUB_OWNER;
  const resolvedRepo = repo ?? process.env.GITHUB_REPO;
  if (!resolvedOwner || !resolvedRepo) {
    throw new Error(
      "Missing repo: set GITHUB_OWNER/GITHUB_REPO or pass owner and repo",
    );
  }
  return { owner: resolvedOwner, repo: resolvedRepo };
}
