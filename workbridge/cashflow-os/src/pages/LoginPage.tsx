import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation } from 'react-router'
import { ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuth } from '@/auth/AuthProvider'
import { APP } from '@/lib/paths'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Logo } from '@/components/layout/Sidebar'

export function LoginPage() {
  const { isAuthenticated, connecting, login, loginWithEmail } = useAuth()
  const location = useLocation()
  const fromState = (location.state as { from?: string } | null)?.from
  const fromQuery = new URLSearchParams(location.search).get('from')
  const raw = fromState || fromQuery || APP
  const from = raw.startsWith('/') && !raw.startsWith('//') ? raw : APP

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const xeroError = new URLSearchParams(location.search).get('xero_error')
  const xeroCode = new URLSearchParams(location.search).get('code')
  const [error, setError] = useState<string | null>(
    xeroError ? 'Xero approved access, but the app did not finish connecting. Please try Sign in with Xero again.' : null,
  )

  if (xeroCode) {
    return <Navigate to={`/login/xero${location.search}`} replace />
  }

  if (isAuthenticated) {
    return <Navigate to={from} replace />
  }

  async function onEmailSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await loginWithEmail(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in.')
    } finally {
      setSubmitting(false)
    }
  }

  async function onXero() {
    setError(null)
    try {
      await login()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start Xero sign-in.')
    }
  }

  const busy = submitting || connecting

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-primary text-primary-foreground lg:flex lg:flex-col lg:justify-between lg:p-10">
        <div className="pointer-events-none absolute -right-16 top-24 size-72 rounded-full bg-lime/20 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -left-10 bottom-10 size-64 rounded-full bg-peach/20 blur-3xl" aria-hidden />
        <div className="relative flex items-center gap-2">
          <span className="flex size-7 items-end justify-center gap-[3px] rounded-lg bg-white/12 px-1.5 pb-1.5" aria-hidden>
            <span className="h-2 w-1 rounded-[1px] bg-sun" />
            <span className="h-3 w-1 rounded-[1px] bg-lime" />
            <span className="h-4 w-1 rounded-[1px] bg-peach" />
          </span>
          <span className="text-[15px] font-bold tracking-[-0.02em]">CashFlow OS</span>
        </div>
        <div className="relative max-w-md">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-primary-foreground/55">Collections desk</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">Get paid faster, without an agent talking to customers on its own.</h2>
          <ul className="mt-8 space-y-3 text-[14px] text-primary-foreground/75">
            <li>Human approval before every outbound email.</li>
            <li>Findings labelled as hypotheses, not facts.</li>
            <li>Connect Xero when you are ready to pull live contacts.</li>
          </ul>
        </div>
        <p className="relative text-[12px] text-primary-foreground/45">CashFlow OS · Brightline Facilities</p>
      </aside>

      <main className="relative flex flex-col bg-background">
        <header className="flex h-16 items-center px-6 lg:hidden">
          <Logo to="/" />
        </header>

        <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
          <div className="marketing-rise w-full max-w-[400px]">
            <h1 className="text-[1.75rem] font-semibold tracking-[-0.03em]">Log in</h1>
            <p className="mt-1.5 text-[14px] text-muted-foreground">Use your work email, or continue with Xero.</p>

            <form className="mt-7 space-y-4" onSubmit={(event) => void onEmailSubmit(event)}>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.co.uk"
                  disabled={busy}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="pr-10"
                    disabled={busy}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {error ? (
                <p className="rounded-lg bg-coral-soft px-3 py-2 text-[13px] text-coral" role="alert">
                  {error}
                </p>
              ) : null}

              <Button size="lg" className="w-full" type="submit" disabled={busy}>
                {submitting ? <Loader2 className="animate-spin" aria-hidden /> : null}
                {submitting ? 'Signing in…' : 'Log in'}
                {!submitting ? <ArrowRight /> : null}
              </Button>
            </form>

            <div className="my-6 flex items-center gap-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              or
              <span className="h-px flex-1 bg-border" />
            </div>

            <Button size="lg" variant="outline" className="w-full" type="button" onClick={() => void onXero()} disabled={busy}>
              {connecting ? <Loader2 className="animate-spin" aria-hidden /> : <XeroMark />}
              {connecting ? 'Redirecting to Xero…' : 'Sign in with Xero'}
            </Button>

            <p className="mt-8 text-center text-xs text-muted-foreground">
              <Link to="/" className="hover:text-foreground hover:underline">
                Back to homepage
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

function XeroMark() {
  return (
    <span className="flex size-4 items-center justify-center rounded-[3px] bg-[#13B5EA] text-[8px] font-bold text-white" aria-hidden>
      x
    </span>
  )
}
