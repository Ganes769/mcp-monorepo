import { useState } from 'react'
import type { ReactNode } from 'react'
import { toast } from 'sonner'
import type { Integration } from '@/types'
import { useSettings } from '@/hooks/queries'
import { useXeroStatus, useDbTest } from '@/hooks/useXero'
import { useXeroConnect } from '@/hooks/useXeroConnect'
import type { Settings } from '@/services/settingsService'
import { formatDateTime, formatMoney, initials } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, Switch } from '@/components/ui/misc'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { PageHeader } from '@/components/shared/PageHeader'
import { ErrorState, LoadingBlock } from '@/components/shared/states'

const SECTIONS = [
  { id: 'company', label: 'Company' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'ai', label: 'AI settings' },
  { id: 'approvals', label: 'Approval policies' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'users', label: 'Users' },
  { id: 'audit', label: 'Audit log' },
] as const

type SectionId = (typeof SECTIONS)[number]['id']

const INTEGRATION_TILE: Record<Integration['id'], { bg: string; text: string }> = {
  xero: { bg: '#13B5EA', text: 'xero' },
  gmail: { bg: '#EA4335', text: 'M' },
  sage: { bg: '#00A650', text: 'sage' },
  quickbooks: { bg: '#2CA01C', text: 'qb' },
}

const saveDemo = () => toast.success('Settings saved', { description: 'Demo mode: changes last until you refresh the page.' })

function ToggleRow({ id, label, description, checked, onChange }: { id: string; label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-6 py-3">
      <div>
        <Label htmlFor={id}>{label}</Label>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  )
}

function SectionCard({ title, description, children, footer }: { title: string; description?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
      {footer && <CardFooter className="justify-end">{footer}</CardFooter>}
    </Card>
  )
}

function CompanySection({ company }: { company: Settings['company'] }) {
  const fields: Array<[string, string]> = [
    ['Company name', company.name],
    ['Company number', company.companyNumber],
    ['VAT number', company.vatNumber],
    ['Registered address', company.address],
    ['Base currency', company.baseCurrency],
    ['Financial year end', company.financialYearEnd],
  ]
  return (
    <SectionCard title="Company" description="Used on reminders and corrected invoices." footer={<Button onClick={saveDemo}>Save changes</Button>}>
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map(([label, value]) => {
          const id = `company-${label.toLowerCase().replace(/\s+/g, '-')}`
          return (
            <div key={label} className="space-y-1.5">
              <Label htmlFor={id}>{label}</Label>
              <Input id={id} defaultValue={value} />
            </div>
          )
        })}
      </div>
    </SectionCard>
  )
}

function IntegrationsSection({ integrations }: { integrations: Integration[] }) {
  const [configuring, setConfiguring] = useState<Integration | null>(null)
  const xero = useXeroStatus()
  const db = useDbTest()
  const { connect, connecting } = useXeroConnect()
  const xeroLive = Boolean(xero.data?.connected && xero.data.token_valid)

  return (
    <SectionCard title="Integrations" description="Connect the systems your collections desk reads. Xero is live; others are coming next.">
      <ul className="divide-y">
        {integrations.map((i) => {
          const tile = INTEGRATION_TILE[i.id]
          const isXero = i.id === 'xero'
          const connected = isXero ? xeroLive : i.status === 'demo_connected'
          return (
            <li key={i.id} className="flex items-center gap-3 py-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white" style={{ background: tile.bg }} aria-hidden>
                {tile.text}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-[13.5px] font-semibold">
                  {i.name}
                  {isXero && xeroLive ? <Badge variant="lime">Connected</Badge> : connected ? <Badge variant="sun">Demo connected</Badge> : <Badge variant="muted">Not connected</Badge>}
                </p>
                <p className="text-xs text-muted-foreground">
                  {i.description}
                  {i.lastSync && !isXero && ` · last sync ${formatDateTime(i.lastSync)}`}
                </p>
              </div>
              {isXero ? (
                connected ? (
                  <Button variant="outline" size="sm" onClick={() => setConfiguring(i)}>
                    Details
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => void connect()} disabled={connecting}>
                    {connecting ? 'Waiting…' : 'Connect'}
                  </Button>
                )
              ) : isXero === false && i.status === 'demo_connected' ? (
                <Button variant="outline" size="sm" onClick={() => setConfiguring(i)}>
                  Configure
                </Button>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span tabIndex={0}>
                      <Button variant="outline" size="sm" disabled>
                        Connect
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Available after the backend integration phase</TooltipContent>
                </Tooltip>
              )}
            </li>
          )
        })}
      </ul>
      <Dialog open={configuring !== null} onOpenChange={(open) => !open && setConfiguring(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{configuring?.name} connection</DialogTitle>
            <DialogDescription>
              {configuring?.id === 'xero' && xeroLive
                ? 'Your Xero organisation is connected. Contacts sync into the collections desk.'
                : `${configuring?.name} is not connected yet.`}
            </DialogDescription>
          </DialogHeader>
          <dl className="divide-y rounded-xl border text-[13px]">
            {(configuring?.id === 'xero' && xero.data
              ? [
                  ['Status', xero.data.token_valid ? 'Connected' : 'Needs reconnect'],
                  ['Organisation', xero.data.tenant_id ? 'Xero organisation linked' : 'Not linked'],
                  ['Database', db.data?.status === 'ok' ? db.data.database : db.error ? 'Unreachable' : 'Checking…'],
                ]
              : [
                  ['Tenant', 'Brightline Facilities Ltd'],
                  ['Sync scope', 'Invoices, contacts, payments'],
                  ['Sync frequency', 'Every 15 minutes'],
                  ['Last sync', configuring?.lastSync ? formatDateTime(configuring.lastSync) : '—'],
                ]
            ).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 px-4 py-2.5">
                <dt className="shrink-0 text-muted-foreground">{k}</dt>
                <dd className="max-w-56 break-all text-right font-medium">{v}</dd>
              </div>
            ))}
          </dl>
          <DialogFooter>
            <Button onClick={() => setConfiguring(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SectionCard>
  )
}

function AiSection({ initial }: { initial: Settings['aiSettings'] }) {
  const [s, setS] = useState(initial)
  return (
    <SectionCard title="AI settings" description="Controls what the agent may do on its own. It never sends anything outside these rules." footer={<Button onClick={saveDemo}>Save changes</Button>}>
      <div className="divide-y">
        <ToggleRow id="ai-auto-reminders" label="Auto-send low-risk friendly reminders" description="Only for invoices under the approval threshold with no dispute or open query." checked={s.autoSendLowRiskReminders} onChange={(v) => setS({ ...s, autoSendLowRiskReminders: v })} />
        <ToggleRow id="ai-pause-dispute" label="Pause reminders when a dispute is detected" description="The agent stops all customer contact and asks a human to review." checked={s.pauseRemindersOnDispute} onChange={(v) => setS({ ...s, pauseRemindersOnDispute: v })} />
        <div className="flex items-start justify-between gap-6 py-3">
          <div>
            <Label htmlFor="ai-min-confidence">Minimum confidence to recommend an action</Label>
            <p className="mt-0.5 text-xs text-muted-foreground">Below this, the agent flags the invoice for review instead of suggesting a next step.</p>
          </div>
          <div className="flex items-center gap-2">
            <Input id="ai-min-confidence" type="number" min={0} max={100} value={s.minimumConfidence} onChange={(e) => setS({ ...s, minimumConfidence: Number(e.target.value) })} className="w-20 text-right" />
            <span className="text-[13px] text-muted-foreground">%</span>
          </div>
        </div>
      </div>
    </SectionCard>
  )
}

function ApprovalPolicySection({ initial }: { initial: Settings['aiSettings'] }) {
  const [threshold, setThreshold] = useState(initial.requireApprovalAbove)
  const [reissue, setReissue] = useState(initial.requireApprovalForReissue)
  const rules = [
    { rule: 'Any message to a customer about a disputed invoice', who: 'Finance Manager review', locked: true },
    { rule: `Actions on invoices above ${formatMoney(threshold)}`, who: 'Finance Manager or Owner', locked: false },
    { rule: 'Re-issuing or correcting an invoice', who: reissue ? 'Any approver' : 'Automatic', locked: false },
    { rule: 'Friendly reminder, low risk, under threshold', who: 'Automatic (logged)', locked: false },
  ]
  return (
    <SectionCard title="Approval policies" description="Decide which AI actions need a human decision." footer={<Button onClick={saveDemo}>Save changes</Button>}>
      <div className="divide-y">
        <div className="flex items-start justify-between gap-6 py-3">
          <div>
            <Label htmlFor="policy-threshold">Require approval above</Label>
            <p className="mt-0.5 text-xs text-muted-foreground">Outstanding amount on the invoice, including VAT.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-muted-foreground">£</span>
            <Input id="policy-threshold" type="number" min={0} step={500} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} className="w-28 text-right" />
          </div>
        </div>
        <ToggleRow id="policy-reissue" label="Require approval before re-issuing an invoice" description="Corrected invoices are always shown to a person before sending." checked={reissue} onChange={setReissue} />
      </div>
      <Table className="mt-3">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Rule</TableHead>
            <TableHead>Who approves</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rules.map((r) => (
            <TableRow key={r.rule}>
              <TableCell className="whitespace-normal">
                {r.rule}
                {r.locked && (
                  <Badge variant="outline" className="ml-2">
                    Always on
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">{r.who}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SectionCard>
  )
}

function NotificationsSection({ initial }: { initial: Settings['notificationSettings'] }) {
  const [s, setS] = useState(initial)
  return (
    <SectionCard title="Notifications" footer={<Button onClick={saveDemo}>Save changes</Button>}>
      <div className="divide-y">
        <ToggleRow id="nt-approvals" label="Approval requests" description="When the agent needs you to approve an action." checked={s.approvalRequests} onChange={(v) => setS({ ...s, approvalRequests: v })} />
        <ToggleRow id="nt-high-risk" label="High-risk findings" description="Disputes, repeated late payments and failed runs." checked={s.highRiskFindings} onChange={(v) => setS({ ...s, highRiskFindings: v })} />
        <ToggleRow id="nt-payments" label="Payments received" description="When an overdue invoice is paid." checked={s.paymentsReceived} onChange={(v) => setS({ ...s, paymentsReceived: v })} />
        <ToggleRow id="nt-digest" label="Daily digest email" description="A summary of receivables every morning at 8:00." checked={s.dailyDigest} onChange={(v) => setS({ ...s, dailyDigest: v })} />
      </div>
    </SectionCard>
  )
}

function UsersSection({ team }: { team: Settings['team'] }) {
  return (
    <SectionCard title="Users" description="People who can review and approve AI actions.">
      <ul className="divide-y">
        {team.map((m) => (
          <li key={m.id} className="flex items-center gap-3 py-3">
            <Avatar>
              <AvatarFallback>{initials(m.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold">{m.name}</p>
              <p className="text-xs text-muted-foreground">{m.email}</p>
            </div>
            <Badge variant={m.role === 'Owner' ? 'default' : 'outline'}>{m.role}</Badge>
          </li>
        ))}
      </ul>
    </SectionCard>
  )
}

function AuditSection({ entries }: { entries: Settings['auditLog'] }) {
  return (
    <SectionCard title="Audit log" description="Every approval, rejection and automatic action, with who did it.">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>When</TableHead>
            <TableHead>Actor</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Target</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((e) => (
            <TableRow key={e.id}>
              <TableCell className="text-muted-foreground">{formatDateTime(e.at)}</TableCell>
              <TableCell className="font-medium">{e.actor}</TableCell>
              <TableCell className="whitespace-normal">{e.action}</TableCell>
              <TableCell className="font-mono text-xs">{e.target}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SectionCard>
  )
}

export function SettingsPage() {
  const [section, setSection] = useState<SectionId>('company')
  const { data, isLoading, error, refetch } = useSettings()

  return (
    <div className="space-y-5">
      <PageHeader title="Settings" description="Company details, integrations, AI behaviour and approval rules." />
      <div className="grid items-start gap-4 lg:grid-cols-[200px_minmax(0,1fr)]">
        <nav aria-label="Settings sections" className="flex gap-1 overflow-x-auto lg:flex-col">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              aria-current={section === s.id ? 'page' : undefined}
              onClick={() => setSection(s.id)}
              className={cn('h-9 shrink-0 rounded-lg px-3 text-left text-[13px] font-medium', section === s.id ? 'bg-card text-foreground shadow-xs ring-1 ring-border' : 'text-foreground/70 hover:bg-card/60')}
            >
              {s.label}
            </button>
          ))}
        </nav>
        {error ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : isLoading || !data ? (
          <LoadingBlock className="h-80" />
        ) : (
          <>
            {section === 'company' && <CompanySection company={data.company} />}
            {section === 'integrations' && <IntegrationsSection integrations={data.integrations} />}
            {section === 'ai' && <AiSection initial={data.aiSettings} />}
            {section === 'approvals' && <ApprovalPolicySection initial={data.aiSettings} />}
            {section === 'notifications' && <NotificationsSection initial={data.notificationSettings} />}
            {section === 'users' && <UsersSection team={data.team} />}
            {section === 'audit' && <AuditSection entries={data.auditLog} />}
          </>
        )}
      </div>
    </div>
  )
}
