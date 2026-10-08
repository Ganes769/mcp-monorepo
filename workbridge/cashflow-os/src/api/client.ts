import axios, { AxiosError, type AxiosInstance } from 'axios'
import { API_BASE_URL } from './config'
import { clearAuthSession } from './session'

export class ApiError extends Error {
  status: number
  loginUrl?: string
  constructor(message: string, status: number, loginUrl?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.loginUrl = loginUrl
  }
}

function detailMessage(data: unknown): string | null {
  if (!data || typeof data !== 'object' || !('detail' in data)) return null
  const detail = (data as { detail: unknown }).detail
  if (typeof detail === 'string') return detail
  if (detail && typeof detail === 'object' && 'message' in detail) return String((detail as { message: unknown }).message)
  return null
}

function loginUrlFrom(data: unknown): string | undefined {
  if (!data || typeof data !== 'object' || !('detail' in data)) return undefined
  const detail = (data as { detail: unknown }).detail
  if (detail && typeof detail === 'object' && 'login_url' in detail) {
    const url = (detail as { login_url: unknown }).login_url
    return typeof url === 'string' && url ? url : undefined
  }
  return undefined
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
      const loginUrl = loginUrlFrom(data)
      const message = detailMessage(data) || error.message || (status === 0 ? 'Cannot reach the server.' : `Request failed (${status})`)
      if (status === 401 && !loginUrl) {
        clearAuthSession()
        const path = window.location.pathname
        if (path !== '/login' && path !== '/' && path !== '/login/xero') {
          window.location.assign(`/login?from=${encodeURIComponent(path)}`)
        }
      }
      return Promise.reject(new ApiError(message, status, loginUrl))
    }
    return Promise.reject(error)
  },
)
