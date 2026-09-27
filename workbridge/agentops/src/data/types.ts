import type { LucideIcon } from 'lucide-react'

export type CallStatus = 'success' | 'blocked' | 'failed'

export type AppId =
  | 'jira'
  | 'slack'
  | 'github'
  | 'notion'
  | 'gdrive'
  | 'postgres'
  | 'salesforce'
  | 'custom'

export interface AppDefinition {
  id: AppId
  name: string
  category: string
  icon: LucideIcon
  /** Tailwind classes for the brand tile, e.g. "bg-blue-600 text-white" */
  tile: string
}

export type ServerId = 'jira' | 'slack'

/** One tool call recorded by the AgentMesh gateway (gateway/data/mcp-calls.jsonl). */
export interface McpCall {
  id: string
  /** Epoch ms */
  at: number
  bot: string
  server: string
  /** Display name, e.g. `jira.search_issues` */
  tool: string
  status: CallStatus
  durationMs: number
  args: Record<string, unknown>
  preview?: string
  error?: string
  source: 'mcp' | 'test'
}

export interface GatewayTool {
  name: string
  mcpName: string
  server: string
  description: string
}

export interface GatewayBotConfig {
  name: string
  scopes: string[]
  paused: boolean
}

export interface GatewayHealth {
  ok: boolean
  mcpUrl: string
  backend: string
  tools: number
}
