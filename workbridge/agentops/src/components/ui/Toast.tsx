import { createContext, useCallback, useContext, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { cn } from '../../lib/cn'

type Tone = 'success' | 'error' | 'info'

interface ToastInput {
  title: string
  description?: string
  tone?: Tone
  action?: { label: string; onClick: () => void }
}

interface ToastItem extends ToastInput {
  id: number
}

const ToastContext = createContext<((t: ToastInput) => void) | null>(null)

const DURATION = 5000

const toneIcon: Record<Tone, ReactNode> = {
  success: <CheckCircle2 className="h-[18px] w-[18px] text-emerald-600" />,
  error: <XCircle className="h-[18px] w-[18px] text-red-600" />,
  info: <Info className="h-[18px] w-[18px] text-blue-600" />,
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(1)

  const dismiss = useCallback((id: number) => setToasts((ts) => ts.filter((t) => t.id !== id)), [])

  const push = useCallback(
    (t: ToastInput) => {
      const id = nextId.current++
      setToasts((ts) => [...ts.slice(-3), { ...t, id }])
      window.setTimeout(() => dismiss(id), DURATION)
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={push}>
      {children}
      {createPortal(
        <div className="pointer-events-none fixed bottom-4 right-4 z-[300] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              role="status"
              className="pointer-events-auto flex animate-slide-up items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-pop"
            >
              <span className="mt-px">{toneIcon[t.tone ?? 'info']}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-950">{t.title}</p>
                {t.description && <p className="mt-0.5 text-[13px] text-slate-500">{t.description}</p>}
                {t.action && (
                  <button
                    type="button"
                    onClick={() => {
                      t.action?.onClick()
                      dismiss(t.id)
                    }}
                    className={cn('mt-2 text-[13px] font-medium text-blue-600 hover:text-blue-700')}
                  >
                    {t.action.label}
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                className="-mr-1 -mt-1 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}
