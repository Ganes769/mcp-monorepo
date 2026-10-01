import type { CollectionPoint, CollectionRange, LateReasonStat, MonthlyMetric, OverviewSummary, RiskBucket } from '@/types'
import { calendarToday, daysOverdue } from '@/lib/dates'
import { lateReasons, monthlyMetrics, previousMonth } from '@/data/analytics'
import { db } from './mockDb'
import { getInvoices, isOverdue, isUnpaid } from './invoiceService'

const round1 = (n: number) => Math.round(n * 10) / 10

export async function getOverview(): Promise<OverviewSummary> {
  const invoices = await getInvoices()
  const unpaid = invoices.filter(isUnpaid)
  const overdue = unpaid.filter(isOverdue)
  const month = calendarToday().slice(0, 7)
  const recovered = invoices.filter((i) => i.paidDate?.startsWith(month)).reduce((sum, i) => sum + i.amount, 0)
  const avgDays = overdue.length ? overdue.reduce((sum, i) => sum + daysOverdue(i.dueDate, calendarToday()), 0) / overdue.length : 0
  const pending = db.approvals.filter((a) => a.status === 'pending')
  const outstanding = unpaid.reduce((sum, i) => sum + i.amountDue, 0)

  return {
    outstanding,
    unpaidCount: unpaid.length,
    overdue: overdue.reduce((sum, i) => sum + i.amountDue, 0),
    overdueCount: overdue.length,
    recoveredThisMonth: recovered,
    recoveredChangePct: recovered === 0 ? 0 : previousMonth.recovered ? round1(((recovered - previousMonth.recovered) / previousMonth.recovered) * 100) : 0,
    averageDaysOverdue: round1(avgDays),
    averageDaysOverdueChange: overdue.length === 0 ? 0 : round1(round1(avgDays) - previousMonth.averageDaysOverdue),
    aiActions: db.agentStats.runsToday,
    aiActionsAutomatic: db.agentStats.automatedActions,
    pendingApprovals: pending.length,
    highPriorityApprovals: pending.filter((a) => a.priority === 'high').length,
  }
}

export async function getCollections(range: CollectionRange): Promise<CollectionPoint[]> {
  const invoices = await getInvoices()
  const outstanding = invoices.filter(isUnpaid).reduce((s, i) => s + i.amountDue, 0)
  const overdue = invoices.filter(isOverdue).reduce((s, i) => s + i.amountDue, 0)
  const collected = invoices.filter((i) => i.paidDate).reduce((s, i) => s + i.amount, 0)
  const label = range === '6m' ? 'Synced' : range.toUpperCase()
  return [{ label, collected, overdue: overdue || outstanding }]
}

export async function getRiskDistribution(): Promise<RiskBucket[]> {
  const invoices = await getInvoices()
  const watched = invoices.filter((i) => isOverdue(i) || i.status === 'due_soon')
  const bucket = (key: RiskBucket['key'], label: string, match: (i: (typeof watched)[number]) => boolean): RiskBucket => {
    const items = watched.filter(match)
    return { key, label, count: items.length, amount: items.reduce((s, i) => s + i.amountDue, 0) }
  }
  return [
    bucket('low', 'Low risk', (i) => i.status !== 'disputed' && i.riskLevel === 'low'),
    bucket('medium', 'Medium risk', (i) => i.status !== 'disputed' && i.riskLevel === 'medium'),
    bucket('high', 'High risk', (i) => i.status !== 'disputed' && i.riskLevel === 'high'),
    bucket('disputed', 'Disputed', (i) => i.status === 'disputed'),
  ]
}

export async function getAnalytics(): Promise<{ monthly: MonthlyMetric[]; lateReasons: LateReasonStat[] }> {
  return { monthly: monthlyMetrics, lateReasons }
}
