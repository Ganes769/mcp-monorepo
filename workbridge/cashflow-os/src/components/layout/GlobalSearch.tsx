import { useEffect, useId, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { FileText, Loader2, Search, Users } from 'lucide-react'
import { useSearch } from '@/hooks/queries'
import { cn } from '@/lib/utils'

export function GlobalSearch() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listId = useId()
  const { data: results = [], isFetching } = useSearch(query)
  const showResults = open && query.trim().length > 0

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    setActive(0)
  }, [query])

  const go = (href: string) => {
    navigate(href)
    setQuery('')
    setOpen(false)
    inputRef.current?.blur()
  }

  return (
    <div className="relative w-full max-w-sm">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <input
        ref={inputRef}
        type="search"
        role="combobox"
        aria-expanded={showResults}
        aria-controls={listId}
        aria-label="Search invoices and customers"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setActive((i) => Math.min(i + 1, results.length - 1))
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setActive((i) => Math.max(i - 1, 0))
          } else if (e.key === 'Enter' && results[active]) {
            go(results[active].href)
          } else if (e.key === 'Escape') {
            setOpen(false)
          }
        }}
        placeholder="Search invoices, customers…"
        className="h-9 w-full rounded-lg border border-input bg-card pl-9 pr-12 text-[13px] shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 [&::-webkit-search-cancel-button]:hidden"
      />
      <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border bg-muted px-1.5 text-[10.5px] font-medium text-muted-foreground sm:block">⌘K</kbd>

      {showResults && (
        <div id={listId} role="listbox" className="absolute left-0 right-0 top-11 z-50 overflow-hidden rounded-xl border bg-popover p-1 shadow-lg">
          {results.length === 0 ? (
            <p className="flex items-center gap-2 px-3 py-6 text-center text-[13px] text-muted-foreground">
              {isFetching ? <Loader2 className="mx-auto size-4 animate-spin" /> : <span className="mx-auto">No invoices or customers match “{query}”</span>}
            </p>
          ) : (
            results.map((result, i) => {
              const Icon = result.type === 'invoice' ? FileText : Users
              return (
                <button
                  key={`${result.type}-${result.id}`}
                  type="button"
                  role="option"
                  aria-selected={i === active}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => go(result.href)}
                  className={cn('flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left', i === active && 'bg-accent')}
                >
                  <Icon className="size-4 text-muted-foreground" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium">{result.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">{result.subtitle}</span>
                  </span>
                  <span className="text-[11px] capitalize text-muted-foreground">{result.type}</span>
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
