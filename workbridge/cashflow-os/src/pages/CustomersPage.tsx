import { useMemo, useState } from 'react'
import { Search, Users } from 'lucide-react'
import { isXeroConnected } from '@/api/auth'
import { ApiError } from '@/api/client'
import { useSyncedContacts, useXeroStatus } from '@/hooks/useXero'
import { activeContacts } from '@/lib/xeroFields'
import { formatDateTime } from '@/lib/format'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState, ErrorState, LoadingRows } from '@/components/shared/states'
import { ConnectXeroButton } from '@/components/auth/ConnectXeroButton'
import { SyncNowButton, XeroLiveBadge } from '@/components/xero/XeroLiveBadge'

export function CustomersPage() {
  const [query, setQuery] = useState('')
  const status = useXeroStatus()
  const connected = isXeroConnected(status.data)
  const { data, isLoading, error, refetch } = useSyncedContacts(true)
  const contacts = useMemo(() => activeContacts(data?.contacts), [data])

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return contacts.filter((c) => {
      if (!q) return true
      return [c.name, c.email].join(' ').toLowerCase().includes(q)
    })
  }, [contacts, query])

  const unauthorized = error instanceof ApiError && error.status === 401

  return (
    <div className="space-y-5">
      <PageHeader
        title="Contacts"
        description={contacts.length ? `${contacts.length} contacts from Xero.` : 'Contacts stored from your Xero organisation.'}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <XeroLiveBadge />
            <SyncNowButton />
            <ConnectXeroButton size="sm" hideWhenConnected loginUrl={status.data?.login_url} error={error} />
          </div>
        }
      />

      {!connected && !contacts.length && !isLoading && !error ? (
        <Card>
          <EmptyState
            icon={Users}
            title="Xero is not connected"
            description="Connect Xero, then contacts from your organisation appear here."
            action={<ConnectXeroButton loginUrl={status.data?.login_url} />}
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="border-b p-4">
            <div className="relative max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search contacts…" className="pl-9" aria-label="Search contacts" />
            </div>
          </div>
          {unauthorized ? (
            <EmptyState
              icon={Users}
              title="Connect Xero to load contacts"
              description="Your Xero session is missing or expired."
              action={<ConnectXeroButton loginUrl={status.data?.login_url} error={error} />}
            />
          ) : error ? (
            <ErrorState error={error} onRetry={() => refetch()} />
          ) : isLoading ? (
            <LoadingRows rows={8} />
          ) : rows.length === 0 ? (
            <EmptyState
              icon={Users}
              title={contacts.length ? 'No contacts match' : 'No contacts yet'}
              description={contacts.length ? 'Try a different search term.' : 'Sync now or import from Xero, then refresh.'}
              action={!contacts.length ? <SyncNowButton /> : undefined}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-semibold">{c.name || '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{c.email || '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{c.updated_at ? formatDateTime(c.updated_at) : '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      )}
    </div>
  )
}
