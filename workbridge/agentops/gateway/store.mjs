import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { BOTS_FILE, CALLS_FILE, DATA_DIR } from './config.mjs'

const MAX_IN_MEMORY = 5000

mkdirSync(DATA_DIR, { recursive: true })

/** @type {Array<Record<string, unknown>>} newest last */
const calls = existsSync(CALLS_FILE)
  ? readFileSync(CALLS_FILE, 'utf8')
      .split('\n')
      .filter(Boolean)
      .flatMap((line) => {
        try {
          return [JSON.parse(line)]
        } catch {
          return []
        }
      })
      .slice(-MAX_IN_MEMORY)
  : []

const listeners = new Set()

export function recordCall(call) {
  const record = { id: `call_${randomUUID().slice(0, 12)}`, ...call }
  appendFileSync(CALLS_FILE, `${JSON.stringify(record)}\n`)
  calls.push(record)
  if (calls.length > MAX_IN_MEMORY) calls.shift()
  for (const listener of listeners) listener(record)
  return record
}

export function listCalls(limit = 500) {
  return calls.slice(-limit).reverse()
}

export function onCall(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function readBots() {
  return JSON.parse(readFileSync(BOTS_FILE, 'utf8'))
}

export function getBotConfig() {
  return readBots()
}

export function setBotPaused(name, paused) {
  const config = readBots()
  if (!config.bots[name]) return null
  config.bots[name].paused = paused
  writeFileSync(BOTS_FILE, `${JSON.stringify(config, null, 2)}\n`)
  return config.bots[name]
}

function scopeMatches(scope, tool) {
  return scope === '*' || scope === tool || (scope.endsWith('.*') && tool.startsWith(scope.slice(0, -1)))
}

/** @returns {{ allowed: true } | { allowed: false, reason: string }} */
export function checkPolicy(bot, tool) {
  const config = readBots()
  const entry = config.bots[bot]
  if (!entry) {
    return config.defaultPolicy === 'allow'
      ? { allowed: true }
      : { allowed: false, reason: `${bot} is not registered with the gateway` }
  }
  if (entry.paused) return { allowed: false, reason: `${bot} is paused in AgentMesh` }
  if (!entry.scopes.some((scope) => scopeMatches(scope, tool))) {
    return { allowed: false, reason: `${tool} is not in ${bot}'s tool scopes` }
  }
  return { allowed: true }
}
