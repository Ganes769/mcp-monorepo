import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/auth/AuthProvider'
import { xeroKeys } from '@/hooks/useXero'
import { isXeroConnected } from '@/api/auth'
import { xeroApi } from '@/api/xero'
import { APP, LOGIN } from '@/lib/paths'

export function XeroReturnPage() {
  const { establishSession } = useAuth()
  const navigate = useNavigate()
  const finished = useRef(false)

  const { data, isError } = useQuery({
    queryKey: xeroKeys.status,
    queryFn: xeroApi.status,
    staleTime: 0,
    retry: 1,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    refetchInterval: (query) => (isXeroConnected(query.state.data) ? false : 2_000),
  })

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (!finished.current) {
        navigate(`${LOGIN}?xero_error=timeout`, { replace: true })
      }
    }, 45_000)
    return () => window.clearTimeout(timeout)
  }, [navigate])

  useEffect(() => {
    if (finished.current) return
    if (isError) {
      finished.current = true
      navigate(`${LOGIN}?xero_error=status`, { replace: true })
      return
    }
    if (!isXeroConnected(data)) return

    finished.current = true
    establishSession()
    navigate(APP, { replace: true })
  }, [data, establishSession, isError, navigate])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Connecting Xero…
      </p>
    </div>
  )
}
