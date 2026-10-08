import { Download, Link2, PlugZap } from 'lucide-react'
import { toast } from 'sonner'
import { isXeroConnected } from '@/api/auth'
import { useXeroImport, useXeroStatus } from '@/hooks/useXero'
import { formatDateTime } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/PageHeader'
import { ConnectXeroButton } from '@/components/auth/ConnectXeroButton'
import { SyncNowButton, XeroLiveBadge } from '@/components/xero/XeroLiveBadge'
import { cn } from '@/lib/utils'

export function XeroPage() {
  const status = useXeroStatus()
  const connected = isXeroConnected(status.data)
  const last = status.data?.last_sync
  const importXero = useXeroImport()

  return (
    <div className="space-y-5">
      <PageHeader
        title="Xero"
        description="Connection status, last sync, and import from your organisation."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <XeroLiveBadge />
            <SyncNowButton />
            <ConnectXeroButton size="sm" hideWhenConnected loginUrl={status.data?.login_url} />
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Connection</p>
          <p className="mt-2 text-lg font-semibold">{connected ? 'Connected' : 'Disconnected'}</p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {connected ? 'Token is valid and ready to sync.' : status.data?.message || 'Connect Xero to pull contacts and invoices.'}
          </p>
          {!connected ? (
            <div className="mt-4">
              <ConnectXeroButton loginUrl={status.data?.login_url} />
            </div>
          ) : null}
        </Card>
        <Card className="p-5">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Organisation</p>
          <p className="mt-2 truncate text-lg font-semibold tabular">{status.data?.tenant_id || '—'}</p>
          <p className="mt-1 text-[13px] text-muted-foreground">{status.data?.connection_count ?? 0} stored connection{status.data?.connection_count === 1 ? '' : 's'}</p>
        </Card>
        <Card className="p-5">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Last sync</p>
          <p className="mt-2 text-lg font-semibold capitalize">{last?.status || '—'}</p>
          <p className="mt-1 text-[13px] text-muted-foreground">{last?.finished_at ? formatDateTime(last.finished_at) : 'Not run yet'}</p>
        </Card>
      </div>

      {last?.error ? (
        <Card className="border-coral/40 bg-coral-soft/40 p-4 text-[13px] text-coral">{last.error}</Card>
      ) : null}

      <Card className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-base">Import from Xero</CardTitle>
            <CardDescription className="mt-1 max-w-xl">
              One-off pull from Xero into the database. Everyday tables read the synced store and refresh on their own.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            disabled={!connected || importXero.isPending}
            onClick={() => {
              importXero.mutate(undefined, {
                onSuccess: (result) => toast.success(`Imported ${result.contacts} contacts and ${result.invoices} invoices.`),
                onError: (error) => toast.error(error instanceof Error ? error.message : 'Import failed.'),
              })
            }}
          >
            <Download className={cn(importXero.isPending && 'animate-pulse')} aria-hidden />
            {importXero.isPending ? 'Importing…' : 'Import from Xero'}
          </Button>
        </div>
        <dl className="mt-5 grid gap-3 text-[13px] sm:grid-cols-2">
          <div className="rounded-xl border bg-muted/40 px-4 py-3">
            <dt className="text-muted-foreground">Contacts stored last sync</dt>
            <dd className="mt-1 font-semibold tabular">{last?.contacts_stored ?? '—'}</dd>
          </div>
          <div className="rounded-xl border bg-muted/40 px-4 py-3">
            <dt className="text-muted-foreground">Invoices stored last sync</dt>
            <dd className="mt-1 font-semibold tabular">{last?.invoices_stored ?? '—'}</dd>
          </div>
        </dl>
      </Card>

      <Card className="flex items-start gap-3 p-5">
        {connected ? <PlugZap className="mt-0.5 size-4 text-lime-strong" aria-hidden /> : <Link2 className="mt-0.5 size-4 text-muted-foreground" aria-hidden />}
        <p className="text-[13px] text-muted-foreground">
          Contacts and invoices pages poll the synced store every few seconds. Deleting a contact in Xero removes it from the table after the next sync.
        </p>
      </Card>
    </div>
  )
}
