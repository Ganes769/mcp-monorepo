import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Bot, Coins, Percent, Timer, UserCheck } from 'lucide-react'
import type { MonthlyMetric } from '@/types'
import { useAnalytics } from '@/hooks/queries'
import { LATE_REASON } from '@/lib/labels'
import { formatMoney, formatPercent } from '@/lib/format'
import { CHART, axisProps } from '@/lib/chart'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { KpiCard, type KpiTrend } from '@/components/shared/KpiCard'
import { PageHeader } from '@/components/shared/PageHeader'
import { AiLabel } from '@/components/shared/ai'
import { ChartTooltip } from '@/components/charts/ChartTooltip'
import { ErrorState, LoadingBlock } from '@/components/shared/states'

function trend(current: number, previous: number, unit: string, higherIsBetter: boolean): KpiTrend {
  const diff = Math.round((current - previous) * 10) / 10
  return { label: `${diff > 0 ? '+' : ''}${diff}${unit}`, direction: diff >= 0 ? 'up' : 'down', positive: higherIsBetter ? diff >= 0 : diff <= 0 }
}

export function AnalyticsPage() {
  const { data, isLoading, error, refetch } = useAnalytics()
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />

  const monthly = data?.monthly ?? []
  const current: MonthlyMetric | undefined = monthly.at(-1)
  const previous: MonthlyMetric | undefined = monthly.at(-2)
  const reasons = (data?.lateReasons ?? []).map((r) => ({ label: LATE_REASON[r.reason], count: r.count })).sort((a, b) => b.count - a.count)
  const reasonsTotal = reasons.reduce((s, r) => s + r.count, 0)
  const loading = isLoading || !current || !previous

  return (
    <div className="space-y-5">
      <PageHeader title="Analytics" description="Collection performance and how much of the work the agent is handling." />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard loading={loading} label="Recovery rate" icon={Percent} value={current && formatPercent(current.recoveryRate, 1)} subtitle="vs last month" trend={current && previous && trend(current.recoveryRate, previous.recoveryRate, 'pts', true)} />
        <KpiCard loading={loading} label="Avg collection time" icon={Timer} value={current && `${current.avgCollectionDays} days`} subtitle="vs last month" trend={current && previous && trend(current.avgCollectionDays, previous.avgCollectionDays, 'd', false)} />
        <KpiCard loading={loading} label="AI automation rate" icon={Bot} value={current && formatPercent(current.automationRate)} subtitle="of actions" trend={current && previous && trend(current.automationRate, previous.automationRate, 'pts', true)} />
        <KpiCard loading={loading} label="Human intervention" icon={UserCheck} value={current && formatPercent(current.humanInterventionRate)} subtitle="of actions" trend={current && previous && trend(current.humanInterventionRate, previous.humanInterventionRate, 'pts', false)} />
        <KpiCard loading={loading} label="Recovered (Sep)" icon={Coins} value={current && formatMoney(current.recovered)} subtitle="vs last month" trend={current && previous && { ...trend(current.recovered / 1000, previous.recovered / 1000, 'k', true), label: `${current.recovered >= previous.recovered ? '+' : ''}${formatMoney(current.recovered - previous.recovered, { compact: true })}` }} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Amount recovered</CardTitle>
            <CardDescription>Overdue balances collected per month</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <LoadingBlock className="h-64" />
            ) : (
              <div className="h-64" role="img" aria-label="Bar chart of amount recovered per month">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthly} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke={CHART.grid} strokeDasharray="3 3" />
                    <XAxis dataKey="month" {...axisProps} />
                    <YAxis {...axisProps} width={52} tickFormatter={(v: number) => formatMoney(v, { compact: true })} />
                    <Tooltip cursor={{ fill: CHART.bar, opacity: 0.5 }} content={<ChartTooltip formatValue={(v) => formatMoney(v)} />} />
                    <Bar dataKey="recovered" name="Recovered" fill={CHART.lime} radius={[6, 6, 6, 6]} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Automation vs human intervention</CardTitle>
            <CardDescription>Share of agent actions completed automatically vs needing a person</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <LoadingBlock className="h-64" />
            ) : (
              <div className="h-64" role="img" aria-label="Line chart of automation and human intervention rates">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthly} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke={CHART.grid} strokeDasharray="3 3" />
                    <XAxis dataKey="month" {...axisProps} />
                    <YAxis {...axisProps} width={44} domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={(v: number) => `${v}%`} />
                    <Tooltip content={<ChartTooltip formatValue={(v) => formatPercent(v)} />} />
                    <Line type="monotone" dataKey="automationRate" name="Automated" stroke={CHART.ink} strokeWidth={2} dot={{ r: 3, fill: CHART.ink }} isAnimationActive={false} />
                    <Line type="monotone" dataKey="humanInterventionRate" name="Human intervention" stroke={CHART.peach} strokeWidth={2} dot={{ r: 3, fill: CHART.peach }} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>Top late-payment reasons</CardTitle>
            <AiLabel>AI-identified likely reason</AiLabel>
          </div>
          <CardDescription>
            Based on {reasonsTotal} investigations this quarter. These are the agent's best hypotheses from invoices, emails and payment history — not reasons confirmed by customers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingBlock className="h-64" />
          ) : (
            <div className="h-72" role="img" aria-label={reasons.map((r) => `${r.label}: ${r.count}`).join(', ')}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reasons} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
                  <CartesianGrid horizontal={false} stroke={CHART.grid} strokeDasharray="3 3" />
                  <XAxis type="number" {...axisProps} allowDecimals={false} />
                  <YAxis type="category" dataKey="label" {...axisProps} width={170} tick={{ ...axisProps.tick, fill: CHART.ink, fontSize: 12 }} />
                  <Tooltip cursor={{ fill: CHART.bar, opacity: 0.5 }} content={<ChartTooltip formatValue={(v) => `${v} invoices`} />} />
                  <Bar dataKey="count" name="Invoices" fill={CHART.peach} radius={[0, 6, 6, 0]} maxBarSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
