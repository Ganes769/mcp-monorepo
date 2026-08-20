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

export type StandupAi = {
  status?: 'ok' | 'skipped' | 'failed'
  summary?: string
  asks?: string[]
  questions?: string[]
  reason?: string
}

export type StandupAssignee = {
  accountId: string
  displayName?: string
  email?: string
  blocked: Issue[]
  in_progress: Issue[]
  done_yesterday: Issue[]
  questions?: string[]
}

export type StandupData = {
  projectKey: string
  jql: string
  staleDays: number
  team: StandupTeam
  me: StandupMe
  atRisk: StandupAtRisk
  assignees?: StandupAssignee[]
  text: string
  ai?: StandupAi | null
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

const EMPTY_COUNTS: StandupTeam['counts'] = {
  blocked: 0,
  in_progress: 0,
  done_yesterday: 0,
  todo: 0,
  done: 0,
  stale: 0,
  unassigned: 0,
  total: 0,
}

export function normalizeStandup(raw: Partial<StandupData> | null | undefined): StandupData | null {
  if (!raw || typeof raw !== 'object') return null
  const team = raw.team || ({} as StandupTeam)
  const me = raw.me || ({} as StandupMe)
  const atRisk = raw.atRisk || ({} as StandupAtRisk)
  return {
    projectKey: raw.projectKey || '',
    jql: raw.jql || '',
    staleDays: raw.staleDays ?? 3,
    team: {
      blocked: team.blocked || [],
      in_progress: team.in_progress || [],
      done_yesterday: team.done_yesterday || [],
      counts: { ...EMPTY_COUNTS, ...(team.counts || {}) },
    },
    me: {
      accountId: me.accountId,
      displayName: me.displayName,
      empty: Boolean(me.empty),
      emptyMessage: me.emptyMessage || 'Nothing assigned to you',
      blocked: me.blocked || [],
      in_progress: me.in_progress || [],
      done_yesterday: me.done_yesterday || [],
    },
    atRisk: {
      blocked: atRisk.blocked || [],
      stale: atRisk.stale || [],
      unassigned: atRisk.unassigned || [],
    },
    assignees: (raw.assignees || []).filter(Boolean),
    text: raw.text || '',
    ai: raw.ai,
  }
}

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
  oauthStatus: () =>
    request<{ jira: JiraConnection; slack: SlackConnection; projectKey?: string }>('/oauth/status'),
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
  getStandup: async (projectKey: string) =>
    normalizeStandup(
      await request<StandupData>(`/jira/projects/${encodeURIComponent(projectKey)}/standup`),
    ),
  postStandup: async (projectKey: string, channel?: string) => {
    const data = await request<StandupData & { channel: string; ts: string }>(
      `/jira/projects/${encodeURIComponent(projectKey)}/standup`,
      {
        method: 'POST',
        body: JSON.stringify(channel ? { channel } : {}),
      },
    )
    const normalized = normalizeStandup(data)
    if (!normalized) throw new Error('Standup response was empty')
    return { ...normalized, channel: data.channel, ts: data.ts }
  },
  saveWorkspace: (projectKey: string) =>
    request<{ projectKey: string }>('/workspace', {
      method: 'POST',
      body: JSON.stringify({ projectKey }),
    }),
  sendPrep: (projectKey: string, options?: { accountId?: string; toMe?: boolean }) =>
    request<{ sent: string[]; skipped: string[]; projectKey: string }>('/standup/prep', {
      method: 'POST',
      body: JSON.stringify({
        projectKey,
        ...(options?.accountId ? { accountId: options.accountId } : {}),
        ...(options?.toMe ? { toMe: true } : {}),
      }),
    }),
}
