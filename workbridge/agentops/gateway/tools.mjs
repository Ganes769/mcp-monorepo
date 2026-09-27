import { z } from 'zod'
import { WORKBRIDGE_API } from './config.mjs'
import { checkPolicy, recordCall } from './store.mjs'

const TIMEOUT_MS = 30_000

async function backend(path, init) {
  const response = await fetch(`${WORKBRIDGE_API}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok) throw new Error(payload?.error ?? `WorkBridge API returned ${response.status}`)
  return payload?.data ?? payload
}

const key = (value) => encodeURIComponent(String(value).toUpperCase())

/**
 * Tool names use dots in AgentMesh (`jira.search_issues`) but MCP clients expect
 * `^[a-zA-Z0-9_-]+$`, so they're exposed as `jira_search_issues`.
 */
export const TOOLS = [
  {
    name: 'jira.list_projects',
    server: 'jira',
    description: 'List Jira projects the connected workspace can access.',
    input: {},
    run: () => backend('/jira/projects'),
  },
  {
    name: 'jira.search_issues',
    server: 'jira',
    description: 'Search issues in a Jira project, optionally with a JQL query.',
    input: {
      projectKey: z.string().describe('Jira project key, e.g. KAN'),
      jql: z.string().optional().describe('Optional JQL. Defaults to all issues in the project, newest first.'),
      maxResults: z.number().int().min(1).max(100).optional(),
    },
    run: ({ projectKey, jql, maxResults }) => {
      const params = new URLSearchParams()
      if (jql) params.set('jql', jql)
      if (maxResults) params.set('maxResults', String(maxResults))
      const qs = params.size ? `?${params}` : ''
      return backend(`/jira/projects/${key(projectKey)}/issues${qs}`)
    },
  },
  {
    name: 'jira.get_issue',
    server: 'jira',
    description: 'Get a single Jira issue with its description.',
    input: { issueKey: z.string().describe('Issue key, e.g. KAN-12') },
    run: ({ issueKey }) => backend(`/jira/issues/${key(issueKey)}`),
  },
  {
    name: 'jira.standup_report',
    server: 'jira',
    description: 'Build a standup report (blocked, in progress, done yesterday) for a Jira project.',
    input: { projectKey: z.string() },
    run: async ({ projectKey }) => {
      const data = await backend(`/jira/projects/${key(projectKey)}/standup`)
      return { projectKey: data.projectKey ?? projectKey, text: data.text }
    },
  },
  {
    name: 'slack.post_standup',
    server: 'slack',
    description: 'Post the Jira standup report for a project to a Slack channel.',
    input: {
      projectKey: z.string(),
      channel: z.string().optional().describe('Slack channel ID. Defaults to the workspace channel.'),
    },
    run: async ({ projectKey, channel }) => {
      const data = await backend(`/jira/projects/${key(projectKey)}/standup`, {
        method: 'POST',
        body: JSON.stringify(channel ? { channel } : {}),
      })
      return { projectKey: data.projectKey, channel: data.channel, ts: data.ts }
    },
  },
  {
    name: 'slack.send_standup_prep',
    server: 'slack',
    description: 'DM each assignee (or only you) their standup prep for a Jira project.',
    input: {
      projectKey: z.string(),
      toMe: z.boolean().optional().describe('Only send the prep DM to the workspace owner.'),
    },
    run: ({ projectKey, toMe }) =>
      backend('/standup/prep', { method: 'POST', body: JSON.stringify({ projectKey, ...(toMe ? { toMe: true } : {}) }) }),
  },
]

export const mcpName = (name) => name.replace('.', '_')

function preview(value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value)
  return text.length > 400 ? `${text.slice(0, 400)}…` : text
}

/** Runs a tool through policy + timing and records the call. Never throws. */
export async function runMonitored({ bot, tool, args, source }) {
  const def = TOOLS.find((t) => t.name === tool)
  const base = { bot, at: new Date().toISOString(), server: def?.server ?? tool.split('.')[0], tool, args, source }

  if (!def) {
    const record = recordCall({ ...base, status: 'failed', durationMs: 0, error: `Unknown tool ${tool}` })
    return { ok: false, error: record.error, record }
  }

  const policy = checkPolicy(bot, tool)
  if (!policy.allowed) {
    const record = recordCall({ ...base, status: 'blocked', durationMs: 0, error: policy.reason })
    return { ok: false, error: policy.reason, record }
  }

  const started = performance.now()
  try {
    const result = await def.run(args ?? {})
    const durationMs = Math.round(performance.now() - started)
    const record = recordCall({ ...base, status: 'success', durationMs, preview: preview(result) })
    return { ok: true, result, record }
  } catch (err) {
    const durationMs = Math.round(performance.now() - started)
    const error = err instanceof Error ? err.message : String(err)
    const record = recordCall({ ...base, status: 'failed', durationMs, error })
    return { ok: false, error, record }
  }
}
