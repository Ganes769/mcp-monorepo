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

  const setProjectKey = useCallback((key: string) => {
    setProjectKeyState(key)
    try {
      if (key) localStorage.setItem(STORAGE_KEY, key)
      else localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
  }, [])

  return { projectKey, setProjectKey }
}
