import { useCallback, useEffect, useRef, useState } from 'react'
import { gateway, parseCall } from '../lib/gateway'
import type { GatewayBotConfig, GatewayHealth, GatewayTool, McpCall } from '../data/types'

const RETRY_MS = 10_000

export type GatewayConnection = 'connecting' | 'online' | 'offline'

export function useGateway() {
  const [connection, setConnection] = useState<GatewayConnection>('connecting')
  const [health, setHealth] = useState<GatewayHealth | null>(null)
  const [tools, setTools] = useState<GatewayTool[]>([])
  const [botConfigs, setBotConfigs] = useState<GatewayBotConfig[]>([])
  const [defaultPolicy, setDefaultPolicy] = useState<'allow' | 'deny'>('allow')
  const [calls, setCalls] = useState<McpCall[]>([])
  const [attempt, setAttempt] = useState(0)
  const seen = useRef(new Set<string>())

  const loadBots = useCallback(async () => {
    const data = await gateway.bots()
    setBotConfigs(data.bots)
    setDefaultPolicy(data.defaultPolicy)
  }, [])

  useEffect(() => {
    let cancelled = false
    let source: EventSource | null = null
    let retry: number | undefined

    const fail = () => {
      if (cancelled) return
      source?.close()
      setConnection('offline')
      retry = window.setTimeout(() => setAttempt((n) => n + 1), RETRY_MS)
    }

    void (async () => {
      try {
        const [h, t, history] = await Promise.all([gateway.health(), gateway.tools(), gateway.calls(), loadBots()])
        if (cancelled) return
        seen.current = new Set(history.map((c) => c.id))
        setHealth(h)
        setTools(t)
        setCalls(history)
        setConnection('online')

        source = new EventSource(gateway.streamUrl)
        source.addEventListener('call', (event) => {
          const call = parseCall(JSON.parse((event as MessageEvent<string>).data))
          if (seen.current.has(call.id)) return
          seen.current.add(call.id)
          setCalls((list) => [call, ...list])
        })
        source.onerror = fail
      } catch {
        fail()
      }
    })()

    return () => {
      cancelled = true
      source?.close()
      window.clearTimeout(retry)
    }
  }, [attempt, loadBots])

  const setPaused = useCallback(
    async (bot: string, paused: boolean) => {
      await gateway.setPaused(bot, paused)
      await loadBots()
    },
    [loadBots],
  )

  const reconnect = useCallback(() => {
    setConnection('connecting')
    setAttempt((n) => n + 1)
  }, [])

  return { connection, health, tools, botConfigs, defaultPolicy, calls, setPaused, reconnect, testCall: gateway.testCall }
}

export type Gateway = ReturnType<typeof useGateway>
