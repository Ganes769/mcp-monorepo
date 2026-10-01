const SESSION_KEY = 'cashflow.auth.session'

function storage(): Storage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function readAuthSession(): boolean {
  return storage()?.getItem(SESSION_KEY) === '1'
}

export function persistAuthSession(): void {
  storage()?.setItem(SESSION_KEY, '1')
}

export function clearAuthSession(): void {
  storage()?.removeItem(SESSION_KEY)
}
