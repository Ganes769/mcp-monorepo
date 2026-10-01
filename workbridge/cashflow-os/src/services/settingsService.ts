import { aiSettings, company, integrations, notificationSettings, team } from '@/data/settings'
import { db, latency } from './mockDb'

/** Future: GET /api/settings */
export async function getSettings() {
  await latency()
  return { company, integrations, aiSettings, notificationSettings, team, auditLog: [...db.auditLog] }
}

export type Settings = Awaited<ReturnType<typeof getSettings>>

/** Future: GET /api/notifications */
export async function getNotifications() {
  await latency(150)
  return [...db.notifications]
}

/** Future: POST /api/notifications/read */
export async function markNotificationsRead(ids?: string[]): Promise<void> {
  await latency(100)
  for (const n of db.notifications) if (!ids || ids.includes(n.id)) n.unread = false
}
