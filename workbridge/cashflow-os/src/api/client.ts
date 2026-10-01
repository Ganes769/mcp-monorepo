import axios, { AxiosError, type AxiosInstance } from 'axios'
import { API_BASE_URL } from './config'
import { clearAuthSession } from './session'

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function detailMessage(data: unknown): string | null {
  if (!data || typeof data !== 'object' || !('detail' in data)) return null
  const detail = (data as { detail: unknown }).detail
  if (typeof detail === 'string') return detail
  if (detail && typeof detail === 'object' && 'message' in detail) return String((detail as { message: unknown }).message)
  return null
}

function isXeroAuthGap(data: unknown): boolean {
  if (!data || typeof data !== 'object' || !('detail' in data)) return false
  const detail = (data as { detail: unknown }).detail
  return Boolean(detail && typeof detail === 'object' && 'login_url' in detail)
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 45_000,
  withCredentials: true,
  headers: { Accept: 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  config.withCredentials = true
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (error instanceof AxiosError) {
      const status = error.response?.status ?? 0
      const data = error.response?.data
      const message = detailMessage(data) || error.message || (status === 0 ? 'Cannot reach the server.' : `Request failed (${status})`)
      if (status === 401 && !isXeroAuthGap(data)) {
        clearAuthSession()
        const path = window.location.pathname
        if (path !== '/login' && path !== '/' && path !== '/login/xero') {
          window.location.assign(`/login?from=${encodeURIComponent(path)}`)
        }
      }
      return Promise.reject(new ApiError(message, status))
    }
    return Promise.reject(error)
  },
)
