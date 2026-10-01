import { useAuth } from '@/auth/AuthProvider'

export function useXeroConnect() {
  const { login, connecting } = useAuth()
  return { connect: login, connecting }
}
