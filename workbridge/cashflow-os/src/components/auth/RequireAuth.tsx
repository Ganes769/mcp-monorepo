import { Navigate, useLocation } from 'react-router'
import { Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { useAuth } from '@/auth/AuthProvider'
import { LOGIN } from '@/lib/paths'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Loading your workspace…
          </p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to={LOGIN} replace state={{ from: location.pathname }} />
  }

  return children
}
