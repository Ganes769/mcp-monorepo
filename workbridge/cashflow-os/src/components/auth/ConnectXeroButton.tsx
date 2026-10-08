import { Loader2 } from 'lucide-react'
import { useAuth } from '@/auth/AuthProvider'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ButtonSize = 'default' | 'lg' | 'sm'
type ButtonVariant = 'default' | 'lime' | 'outline'

export function ConnectXeroButton({
  className,
  size = 'default',
  variant,
  hideWhenConnected = false,
  label = 'Connect Xero',
}: {
  className?: string
  size?: ButtonSize
  variant?: ButtonVariant
  hideWhenConnected?: boolean
  loginUrl?: string | null
  error?: unknown
  label?: string
}) {
  const { xeroConnected, connecting, login } = useAuth()

  if (xeroConnected && hideWhenConnected) return null

  if (xeroConnected) return null

  return (
    <Button
      size={size}
      variant={variant}
      className={cn(className)}
      disabled={connecting}
      onClick={() => {
        void login()
      }}
    >
      {connecting ? <Loader2 className="animate-spin" aria-hidden /> : null}
      {connecting ? 'Redirecting to Xero…' : label}
    </Button>
  )
}
