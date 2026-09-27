import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../lib/api'
import type { OAuthStatus, Provider } from '../lib/api'

const POLL_MS = 2000
const CONNECT_TIMEOUT_MS = 3 * 60_000
/** Connections can also change from the WorkBridge web app, so keep this view in sync. */
const BACKGROUND_REFRESH_MS = 30_000

export type IntegrationState =
  | { phase: 'loading' }
  | { phase: 'error'; message: string }
  | { phase: 'ready'; status: OAuthStatus }

export function useIntegrations() {
  const [state, setState] = useState<IntegrationState>({ phase: 'loading' })
  const [connecting, setConnecting] = useState<Provider | null>(null)
  const [disconnecting, setDisconnecting] = useState<Provider | null>(null)
  const pollRef = useRef<number | undefined>(undefined)

  const refresh = useCallback(async (): Promise<OAuthStatus | null> => {
    try {
      const status = await api.oauthStatus()
      setState({ phase: 'ready', status })
      return status
    } catch (err) {
      setState({ phase: 'error', message: err instanceof Error ? err.message : 'Gateway unreachable' })
      return null
    }
  }, [])

  useEffect(() => {
    void refresh()
    const onFocus = () => void refresh()
    const background = window.setInterval(onFocus, BACKGROUND_REFRESH_MS)
    window.addEventListener('focus', onFocus)
    return () => {
      window.clearInterval(pollRef.current)
      window.clearInterval(background)
      window.removeEventListener('focus', onFocus)
    }
  }, [refresh])

  /**
   * The backend's OAuth callback redirects to the WorkBridge web app rather than back here,
   * so the flow runs in a popup and completion is detected by polling /oauth/status.
   */
  const connect = useCallback(
    (provider: Provider): Promise<boolean> =>
      new Promise((resolve) => {
        const popup = window.open(api.connectUrl(provider), `connect-${provider}`, 'width=620,height=760')
        if (!popup) {
          window.location.href = api.connectUrl(provider)
          return resolve(false)
        }
        setConnecting(provider)
        const started = Date.now()
        window.clearInterval(pollRef.current)

        const finish = (ok: boolean) => {
          window.clearInterval(pollRef.current)
          setConnecting(null)
          if (!popup.closed) popup.close()
          resolve(ok)
        }

        pollRef.current = window.setInterval(async () => {
          const status = await refresh()
          if (status?.[provider].connected) return finish(true)
          if (popup.closed || Date.now() - started > CONNECT_TIMEOUT_MS) finish(false)
        }, POLL_MS)
      }),
    [refresh],
  )

  const disconnect = useCallback(
    async (provider: Provider) => {
      setDisconnecting(provider)
      try {
        await api.disconnect(provider)
        await refresh()
      } finally {
        setDisconnecting(null)
      }
    },
    [refresh],
  )

  return { state, connecting, disconnecting, refresh, connect, disconnect }
}

export type Integrations = ReturnType<typeof useIntegrations>
