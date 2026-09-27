import { Database, FileText, GitBranch, HardDrive, Hash, SquareKanban, Target, Terminal } from 'lucide-react'
import type { AppDefinition, AppId, ServerId } from './types'

export const APPS: Record<AppId, AppDefinition> = {
  jira: { id: 'jira', name: 'Jira', category: 'Project management', icon: SquareKanban, tile: 'bg-[#0C66E4] text-white' },
  slack: { id: 'slack', name: 'Slack', category: 'Communication', icon: Hash, tile: 'bg-[#4A154B] text-white' },
  github: { id: 'github', name: 'GitHub', category: 'Source control', icon: GitBranch, tile: 'bg-slate-900 text-white' },
  notion: { id: 'notion', name: 'Notion', category: 'Knowledge base', icon: FileText, tile: 'bg-white text-slate-900 ring-1 ring-inset ring-slate-200' },
  gdrive: { id: 'gdrive', name: 'Google Drive', category: 'File storage', icon: HardDrive, tile: 'bg-[#E8F0FE] text-[#1A73E8]' },
  postgres: { id: 'postgres', name: 'PostgreSQL', category: 'Database', icon: Database, tile: 'bg-[#336791] text-white' },
  salesforce: { id: 'salesforce', name: 'Salesforce', category: 'CRM', icon: Target, tile: 'bg-[#00A1E0] text-white' },
  custom: { id: 'custom', name: 'Custom MCP Server', category: 'Bring your own server', icon: Terminal, tile: 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200' },
}

export const CATALOG_APPS: AppId[] = ['github', 'notion', 'gdrive', 'postgres', 'salesforce', 'custom']

export const SERVER_IDS: ServerId[] = ['jira', 'slack']

export function appFor(server: string): AppId {
  return server in APPS ? (server as AppId) : 'custom'
}

export function serverName(server: string): string {
  return server in APPS ? `${APPS[server as AppId].name} MCP` : `${server} MCP`
}
