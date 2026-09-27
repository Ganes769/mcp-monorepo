import { cn } from '../../lib/cn'
import { APPS } from '../../data/apps'
import type { AppId } from '../../data/types'

export function Avatar({ name, size = 32, className }: { name: string; size?: number; className?: string }) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  return (
    <span
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 font-semibold text-white ring-2 ring-white',
        className,
      )}
    >
      {initials}
    </span>
  )
}

export function AppIcon({ app, size = 'md', className }: { app: AppId; size?: 'xs' | 'sm' | 'md' | 'lg'; className?: string }) {
  const def = APPS[app]
  const Icon = def.icon
  const box = { xs: 'h-5 w-5 rounded-md', sm: 'h-7 w-7 rounded-lg', md: 'h-9 w-9 rounded-xl', lg: 'h-11 w-11 rounded-xl' }[size]
  const icon = { xs: 'h-3 w-3', sm: 'h-3.5 w-3.5', md: 'h-[18px] w-[18px]', lg: 'h-5 w-5' }[size]
  return (
    <span className={cn('inline-flex shrink-0 items-center justify-center', box, def.tile, className)}>
      <Icon className={icon} strokeWidth={2} />
    </span>
  )
}

export function Sparkline({
  data,
  width = 96,
  height = 32,
  stroke = '#2563EB',
  fill = true,
}: {
  data: number[]
  width?: number
  height?: number
  stroke?: string
  fill?: boolean
}) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const step = width / (data.length - 1)
  const pts = data.map((v, i) => [i * step, height - 3 - ((v - min) / range) * (height - 6)] as const)
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const id = `spark-${stroke.replace('#', '')}`
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible" aria-hidden>
      {fill && (
        <>
          <defs>
            <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity="0.18" />
              <stop offset="100%" stopColor={stroke} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${line} L${width},${height} L0,${height} Z`} fill={`url(#${id})`} />
        </>
      )}
      <path d={line} fill="none" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.5" fill={stroke} />
    </svg>
  )
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-5 items-center rounded border border-slate-200 bg-slate-50 px-1.5 font-sans text-[11px] font-medium text-slate-500">
      {children}
    </kbd>
  )
}

export function CodeBlock({ value, className }: { value: unknown; className?: string }) {
  return (
    <pre
      className={cn(
        'scrollbar-thin overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-[12px] leading-relaxed text-slate-700',
        className,
      )}
    >
      {JSON.stringify(value, null, 2)}
    </pre>
  )
}
