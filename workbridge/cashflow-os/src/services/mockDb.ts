import { agentActions, agentDailyStats, agentEvents, agentRuns } from '@/data/agentRuns'
import { approvals } from '@/data/approvals'
import { communications } from '@/data/communications'
import { customers } from '@/data/customers'
import { followUps } from '@/data/followUps'
import { investigations } from '@/data/investigations'
import { invoices } from '@/data/invoices'
import { payments } from '@/data/payments'
import { auditLog, notifications } from '@/data/settings'

/**
 * In-memory stand-in for the backend database. Services read and mutate this so approvals,
 * rejections and simulated agent runs persist for the session. It resets on page reload.
 */
export const db = {
  invoices: structuredClone(invoices),
  customers: structuredClone(customers),
  payments: structuredClone(payments),
  communications: structuredClone(communications),
  investigations: structuredClone(investigations),
  approvals: structuredClone(approvals),
  followUps: structuredClone(followUps),
  agentRuns: structuredClone(agentRuns),
  agentActions: structuredClone(agentActions),
  agentEvents: structuredClone(agentEvents),
  agentStats: structuredClone(agentDailyStats),
  auditLog: structuredClone(auditLog),
  notifications: structuredClone(notifications),
}

let sequence = 0
export function nextId(prefix: string): string {
  sequence += 1
  return `${prefix}_${Date.now().toString(36)}${sequence}`
}

/** Simulated network latency so loading states are exercised. */
export function latency(ms = 250): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms + Math.random() * 150))
}

export class NotFoundError extends Error {
  constructor(entity: string, id: string) {
    super(`${entity} ${id} was not found`)
    this.name = 'NotFoundError'
  }
}
