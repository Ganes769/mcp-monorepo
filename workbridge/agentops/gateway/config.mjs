import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const GATEWAY_DIR = dirname(fileURLToPath(import.meta.url))
export const DATA_DIR = join(GATEWAY_DIR, 'data')
export const CALLS_FILE = join(DATA_DIR, 'mcp-calls.jsonl')
export const BOTS_FILE = join(GATEWAY_DIR, 'bots.json')

const envFile = join(GATEWAY_DIR, '..', '.env')
if (existsSync(envFile)) process.loadEnvFile(envFile)

export const PORT = Number(process.env.AGENTMESH_GATEWAY_PORT ?? 8787)
export const HOST = process.env.AGENTMESH_GATEWAY_HOST ?? '127.0.0.1'
export const WORKBRIDGE_API = (process.env.WORKBRIDGE_API_BASE ?? process.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

if (!WORKBRIDGE_API) {
  console.error('Set VITE_API_BASE_URL (or WORKBRIDGE_API_BASE) in agentops/.env')
  process.exit(1)
}
