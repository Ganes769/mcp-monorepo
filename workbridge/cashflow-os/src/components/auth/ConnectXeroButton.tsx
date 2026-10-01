import { Loader2 } from 'lucide-react'
import { Link } from 'react-router'
import { useAuth } from '@/auth/AuthProvider'
import { Button } from '@/components/ui/button'
import { appPath } from '@/lib/paths'
import { cn } from '@/lib/utils'

type ButtonSize = 'default' | 'lg' | 'sm'
type ButtonVariant = 'default' | 'lime' | 'outline'

export function ConnectXeroButton({
  className,
  size = 'default',
  variant,
  hideWhenConnected = false,
}: {
  className?: string
  size?: ButtonSize
  variant?: ButtonVariant
  hideWhenConnected?: boolean
}) {
  const { isAuthenticated, isLoading, connecting, login } = useAuth()
  const busy = connecting || isLoading

  if (isLoading && !isAuthenticated) {
    return (
      <Button size={size} variant={variant} className={className} disabled>
        <Loader2 className="animate-spin" aria-hidden />
        Checking…
      </Button>
    )
  }

  if (isAuthenticated) {
    if (hideWhenConnected) return null
    return (
      <Button size={size} variant={variant ?? 'outline'} className={className} asChild>
        <Link to={appPath('/customers')}>View Xero contacts</Link>
      </Button>
    )
  }

  return (
    <Button
      size={size}
      variant={variant}
      className={cn(className)}
      disabled={busy}
      onClick={() => {
        void login()
      }}
    >
      {busy ? <Loader2 className="animate-spin" aria-hidden /> : null}
      {connecting ? 'Waiting for Xero…' : 'Sign in with Xero'}
    </Button>
  )
}
