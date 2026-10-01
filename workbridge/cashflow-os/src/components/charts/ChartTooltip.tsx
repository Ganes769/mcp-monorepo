interface TooltipEntry {
  name?: string | number
  value?: number | string | ReadonlyArray<number | string>
  color?: string
  dataKey?: unknown
}

interface ChartTooltipProps {
  active?: boolean
  payload?: ReadonlyArray<TooltipEntry>
  label?: string | number
  formatValue?: (value: number) => string
}

/** Passed to Recharts as `content={<ChartTooltip />}`; Recharts injects active/payload/label. */
export function ChartTooltip({ active, payload, label, formatValue = (v) => String(v) }: ChartTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="min-w-36 rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      {label !== undefined && <p className="mb-1.5 font-semibold">{label}</p>}
      <ul className="space-y-1">
        {payload.map((entry) => (
          <li key={String(entry.dataKey ?? entry.name)} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="size-2 rounded-sm" style={{ background: entry.color }} aria-hidden />
              {entry.name}
            </span>
            <span className="font-semibold tabular">{typeof entry.value === 'number' ? formatValue(entry.value) : String(entry.value ?? '')}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
