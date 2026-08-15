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

export type StandupTeam = {
  blocked: Issue[]
  in_progress: Issue[]
  done_yesterday: Issue[]
  counts: {
    blocked: number
    in_progress: number
    done_yesterday: number
    todo: number
    done: number
    stale: number
    unassigned: number
    total: number
  }
}

export type StandupMe = {
  accountId?: string
  displayName?: string
  empty: boolean
  emptyMessage: string
  in_progress: Issue[]
  blocked: Issue[]
  done_yesterday: Issue[]
}

export type StandupAtRisk = {
  blocked: Issue[]
  stale: Issue[]
  unassigned: Issue[]
}

export type StandupData = {
  projectKey: string
  jql: string
  staleDays: number
  team: StandupTeam
  me: StandupMe
  atRisk: StandupAtRisk
  text: string
}

export type JiraConnection = {
  connected: boolean
  siteUrl?: string
  siteName?: string
}

export type SlackConnection = {
  connected: boolean
  teamName?: string
  channelId?: string
  redirectUri?: string
}

export const API_BASE =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ||
  'https://jpoe7wlfq7.execute-api.eu-west-2.amazonaws.com'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
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
  oauthStatus: () => request<{ jira: JiraConnection; slack: SlackConnection }>('/oauth/status'),
  oauthDisconnect: (provider: 'jira' | 'slack' = 'jira') =>
    request<{ disconnected: string }>('/oauth/disconnect', {
      method: 'POST',
      body: JSON.stringify({ provider }),
    }),
  jiraConnectUrl: () => `${API_BASE}/oauth/jira/start`,
  slackConnectUrl: () => `${API_BASE}/oauth/slack/start`,
  listProjects: () => request<Project[]>('/jira/projects'),
  listIssues: (projectKey: string) =>
    request<{ projectKey: string; issues: Issue[]; total: number }>(
      `/jira/projects/${encodeURIComponent(projectKey)}/issues`,
    ),
  getStandup: (projectKey: string) =>
    request<StandupData>(`/jira/projects/${encodeURIComponent(projectKey)}/standup`),
  postStandup: (projectKey: string, channel?: string) =>
    request<StandupData & { channel: string; ts: string }>(
      `/jira/projects/${encodeURIComponent(projectKey)}/standup`,
      {
        method: 'POST',
        body: JSON.stringify(channel ? { channel } : {}),
      },
    ),
}
