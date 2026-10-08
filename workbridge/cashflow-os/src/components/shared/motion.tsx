import { type ReactNode, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}

/** Plays a rise animation the first time the block enters the viewport. */
export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const reduced = usePrefersReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(reduced)

  useEffect(() => {
    if (reduced) return
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShown(true)
          io.disconnect()
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [reduced])

  return (
    <div
      ref={ref}
      className={cn(shown && !reduced && 'ui-rise', !shown && !reduced && 'ui-rise-pending', className)}
      style={shown && !reduced ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  )
}

export function useCycle<T>(items: readonly T[], intervalMs: number) {
  const reduced = usePrefersReducedMotion()
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (reduced || items.length < 2) return
    const id = window.setInterval(() => setIndex((i) => (i + 1) % items.length), intervalMs)
    return () => window.clearInterval(id)
  }, [items.length, intervalMs, reduced])

  return { item: items[index]!, index }
}
