import type { CollectionPoint, LateReasonStat, MonthlyMetric } from '@/types'
import { DEMO_TODAY, addDays } from '@/lib/dates'

export const monthlyCollections: CollectionPoint[] = [
  { label: 'Apr', collected: 86_200, overdue: 61_400 },
  { label: 'May', collected: 91_500, overdue: 68_900 },
  { label: 'Jun', collected: 88_300, overdue: 72_100 },
  { label: 'Jul', collected: 97_800, overdue: 69_300 },
  { label: 'Aug', collected: 94_100, overdue: 79_600 },
  { label: 'Sep', collected: 102_600, overdue: 74_820 },
]

/** Deterministic pseudo-random sequence so the daily series is stable between reloads. */
function seeded(seed: number) {
  let s = seed
  return () => {
    s = (s * 16_807) % 2_147_483_647
    return (s - 1) / 2_147_483_646
  }
}

/** Last 90 days of daily collections, oldest first, ending on DEMO_TODAY. */
export const dailyCollections: Array<{ date: string; collected: number; overdue: number }> = (() => {
  const rand = seeded(48_291)
  const days = 90
  return Array.from({ length: days }, (_, i) => {
    const date = addDays(DEMO_TODAY, i - days + 1)
    const weekday = new Date(`${date}T00:00:00`).getDay()
    const weekend = weekday === 0 || weekday === 6
    const collected = weekend ? Math.round(rand() * 900) : Math.round((2_600 + rand() * 4_200) / 10) * 10
    // Overdue balance drifts between ~66k and ~80k, finishing at today's figure.
    const overdue = i === days - 1 ? 74_820 : Math.round((70_000 + Math.sin(i / 9) * 5_500 + rand() * 2_500) / 10) * 10
    return { date, collected, overdue }
  })
})()

export const monthlyMetrics: MonthlyMetric[] = [
  { month: 'Apr', recoveryRate: 58, avgCollectionDays: 19.4, automationRate: 41, humanInterventionRate: 59, recovered: 21_300 },
  { month: 'May', recoveryRate: 61, avgCollectionDays: 18.1, automationRate: 48, humanInterventionRate: 52, recovered: 23_900 },
  { month: 'Jun', recoveryRate: 63, avgCollectionDays: 17.2, automationRate: 55, humanInterventionRate: 45, recovered: 24_750 },
  { month: 'Jul', recoveryRate: 66, avgCollectionDays: 15.8, automationRate: 62, humanInterventionRate: 38, recovered: 26_100 },
  { month: 'Aug', recoveryRate: 68, avgCollectionDays: 13.9, automationRate: 67, humanInterventionRate: 33, recovered: 27_365 },
  { month: 'Sep', recoveryRate: 72, avgCollectionDays: 11.6, automationRate: 73, humanInterventionRate: 27, recovered: 32_400 },
]

/** Previous month's figures, used for month-on-month comparisons. */
export const previousMonth = { recovered: 27_365, averageDaysOverdue: 13.9 }

export const lateReasons: LateReasonStat[] = [
  { reason: 'missing_po', count: 9 },
  { reason: 'customer_dispute', count: 7 },
  { reason: 'incorrect_invoice', count: 5 },
  { reason: 'approval_delay', count: 8 },
  { reason: 'cash_flow_issue', count: 4 },
  { reason: 'unknown', count: 3 },
]
