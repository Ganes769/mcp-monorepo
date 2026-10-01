import type { LucideIcon } from 'lucide-react'
import { Database, Mail, MailOpen, Phone, Sparkles, UserCheck } from 'lucide-react'
import type { Communication, CommunicationChannel } from '@/types'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'

const CHANNEL: Record<CommunicationChannel, { icon: LucideIcon; className: string; label: string }> = {
  email: { icon: Mail, className: 'bg-muted text-foreground/70', label: 'Email' },
  system: { icon: Database, className: 'bg-muted text-foreground/70', label: 'Accounting' },
  agent: { icon: Sparkles, className: 'bg-sun-soft text-sun-strong', label: 'AI agent' },
  call: { icon: Phone, className: 'bg-muted text-foreground/70', label: 'Call' },
  human: { icon: UserCheck, className: 'bg-lime-soft text-lime-strong', label: 'Team' },
}

export function CommunicationTimeline({ items, showInvoice = false }: { items: Communication[]; showInvoice?: boolean }) {
  return (
    <ol className="relative">
      {items.map((item, i) => {
        const meta = CHANNEL[item.channel]
        const Icon = item.channel === 'email' && item.direction === 'inbound' ? MailOpen : meta.icon
        return (
          <li key={item.id} className="relative flex gap-3 pb-5 last:pb-0">
            {i < items.length - 1 && <span className="absolute bottom-0 left-[15px] top-8 w-px bg-border" aria-hidden />}
            <span className={cn('z-[1] flex size-8 shrink-0 items-center justify-center rounded-full ring-4 ring-card', meta.className)}>
              <Icon className="size-3.5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1 pt-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <p className="text-[13px] font-medium">{item.title}</p>
                <time dateTime={item.at} className="text-[11px] text-muted-foreground tabular">
                  {formatDate(item.at)}
                  {item.at.length > 10 && item.at.slice(11, 16) !== '00:00' && ` · ${item.at.slice(11, 16)}`}
                </time>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {meta.label}
                {item.direction !== 'internal' && ` · ${item.direction}`}
                {showInvoice && item.invoiceId && ` · ${item.invoiceId.toUpperCase()}`}
              </p>
              {item.body && <p className="mt-1.5 rounded-lg bg-muted/60 px-3 py-2 text-[12.5px] leading-relaxed text-foreground/80">{item.body}</p>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
