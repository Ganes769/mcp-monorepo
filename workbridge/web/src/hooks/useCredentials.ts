import { useCallback, useEffect, useState } from 'react'
import type { JiraCredentials } from '../api/client'

const STORAGE_KEY = 'workbridge.jira.credentials'

const defaults: JiraCredentials = {
  email: '',
  token: '',
  baseUrl: 'https://ganeshsnawali.atlassian.net',
}

export function useCredentials() {
  const [credentials, setCredentials] = useState<JiraCredentials>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return defaults
      return { ...defaults, ...JSON.parse(raw) }
    } catch {
      return defaults
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(credentials))
  }, [credentials])

  const update = useCallback((patch: Partial<JiraCredentials>) => {
    setCredentials((prev) => ({ ...prev, ...patch }))
  }, [])

  const clear = useCallback(() => setCredentials(defaults), [])

  return { credentials, update, clear, setCredentials }
}
