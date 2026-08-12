export type JiraCredentials = {
  email: string
  token: string
  baseUrl: string
}

export type Project = {
  id: string
  key: string
  name: string
  style?: string
}

export type Issue = {
  key: string
  id?: string
  summary: string
  status?: string
  assignee?: string
  priority?: string
  issuetype?: string
  updated?: string
  created?: string
  url?: string
}

export type StandupGroups = {
  todo: Issue[]
  in_progress: Issue[]
  done: Issue[]
  blocked: Issue[]
}

export type StandupData = StandupGroups & {
  projectKey: string
  jql: string
  counts: Record<keyof StandupGroups, number>
  text: string
}

const API_BASE =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ||
  'https://jpoe7wlfq7.execute-api.eu-west-2.amazonaws.com'

function authHeaders(creds: JiraCredentials): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (creds.email) headers['X-Jira-Email'] = creds.email
  if (creds.token) headers['X-Jira-Api-Token'] = creds.token
  if (creds.baseUrl) headers['X-Jira-Base-Url'] = creds.baseUrl
  return headers
}

async function request<T>(
  path: string,
  creds: JiraCredentials,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...authHeaders(creds),
      ...(init?.headers || {}),
    },
  })
  const payload = await response.json()
  if (!response.ok) {
    throw new Error(payload?.error || `Request failed (${response.status})`)
  }
  return payload.data as T
}

export const api = {
  health: async () => {
    const response = await fetch(`${API_BASE}/health`)
    return response.json()
  },
  listProjects: (creds: JiraCredentials) =>
    request<Project[]>('/jira/projects', creds),
  listIssues: (creds: JiraCredentials, projectKey: string) =>
    request<{ projectKey: string; issues: Issue[]; total: number }>(
      `/jira/projects/${encodeURIComponent(projectKey)}/issues`,
      creds,
    ),
  getStandup: (creds: JiraCredentials, projectKey: string) =>
    request<StandupData>(
      `/jira/projects/${encodeURIComponent(projectKey)}/standup`,
      creds,
    ),
  postStandup: (creds: JiraCredentials, projectKey: string, channel?: string) =>
    request<{
      projectKey: string
      channel: string
      ts: string
      counts: StandupData['counts']
      text: string
    }>(`/jira/projects/${encodeURIComponent(projectKey)}/standup`, creds, {
      method: 'POST',
      body: JSON.stringify(channel ? { channel } : {}),
    }),
}
