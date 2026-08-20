import { useCallback, useState } from 'react'

const STORAGE_KEY = 'workbridge.selectedProject'

export function useSelectedProject() {
  const [projectKey, setProjectKeyState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || ''
    } catch {
      return ''
    }
  })

  const setProjectKey = useCallback((key: string | ((current: string) => string)) => {
    setProjectKeyState((current) => {
      const next = typeof key === 'function' ? key(current) : key
      try {
        if (next) localStorage.setItem(STORAGE_KEY, next)
        else localStorage.removeItem(STORAGE_KEY)
      } catch {
        /* ignore */
      }
      return next
    })
  }, [])

  return { projectKey, setProjectKey }
}
