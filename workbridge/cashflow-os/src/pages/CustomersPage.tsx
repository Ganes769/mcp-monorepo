import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Search, Users } from 'lucide-react'
import { useXeroContacts, useXeroStatus } from '@/hooks/useXero'
import { useXeroConnect } from '@/hooks/useXeroConnect'
import { initials } from '@/lib/format'
import { xeroCity, xeroContactName, xeroPhone } from '@/lib/xeroDisplay'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/misc'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState, ErrorState, LoadingRows } from '@/components/shared/states'
import { ConnectXeroButton } from '@/components/auth/ConnectXeroButton'
import { Badge } from '@/components/ui/badge'
import { appPath } from '@/lib/paths'

export function CustomersPage() {
  const [query, setQuery] = useState('')
  const status = useXeroStatus()
  const connected = Boolean(status.data?.connected && status.data.token_valid)
  const { data, isLoading, error, refetch } = useXeroContacts(true)
  const { connect, connecting } = useXeroConnect()

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (data?.contacts ?? []).filter((c) => {
      if (!q) return true
      const haystack = [c.name, c.email_address, c.account_number, xeroContactName(c), xeroCity(c.addresses)].join(' ').toLowerCase()
      return haystack.includes(q)
    })
  }, [data, query])

  return (
    <div className="space-y-5">
      <PageHeader
        title="Customers"
        description={data?.count ? `${data.count} contacts from Xero.` : 'Connect Xero to load live contacts from your organisation.'}
        actions={<ConnectXeroButton size="sm" hideWhenConnected />}
      />

      {!data?.contacts?.length && !connected && !status.isLoading && !isLoading && !error ? (
        <Card>
          <EmptyState
            icon={Users}
            title="Xero is not connected"
            description={status.data?.message && !status.data.message.includes('/') ? status.data.message : 'Connect Xero to pull contacts from your organisation.'}
            action={
              <Button onClick={() => void connect()} disabled={connecting}>
                {connecting ? 'Waiting for Xero…' : 'Connect Xero'}
              </Button>
            }
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
          {error ? (
            <ErrorState error={error} onRetry={() => refetch()} />
          ) : isLoading || status.isLoading ? (
            <LoadingRows rows={8} />
          ) : rows.length === 0 ? (
            <EmptyState icon={Users} title="No contacts match" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Contact</TableHead>
                  <TableHead>Person</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>VAT</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((c) => (
                  <TableRow key={c.contact_id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar className="size-8 rounded-lg">
                          <AvatarFallback className="rounded-lg text-[11px]">{initials(c.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <Link to={appPath(`/customers/${c.contact_id}`)} className="font-semibold hover:underline">
                              {c.name}
                            </Link>
                          <p className="text-[11px] text-muted-foreground">{c.account_number ?? c.contact_id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{xeroContactName(c) || '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{c.email_address || '—'}</TableCell>
                    <TableCell className="tabular">{xeroPhone(c.phones) || '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{xeroCity(c.addresses) || '—'}</TableCell>
                    <TableCell className="tabular text-muted-foreground">{c.tax_number || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={c.contact_status === 'ACTIVE' ? 'lime' : 'muted'}>{c.contact_status ?? 'Unknown'}</Badge>
                    </TableCell>
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
