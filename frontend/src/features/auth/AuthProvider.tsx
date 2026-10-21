import { useCallback, useEffect, useMemo, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api, setAccessToken, type User } from '../../lib/api'
import { AuthContext } from './authContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const session = useQuery({ queryKey: ['session'], queryFn: async () => {
    const token = await api.auth.refresh()
    if (!token) return null
    try { return await api.auth.me() } catch { setAccessToken(null); return null }
  }, retry: false, staleTime: Infinity })
  const user = session.data ?? null
  const loading = session.isPending

  const refreshUser = useCallback(async () => {
    const token = await api.auth.refresh()
    if (!token) { setAccessToken(null); queryClient.setQueryData(['session'], null); return false }
    try { queryClient.setQueryData<User | null>(['session'], await api.auth.me()); return true }
    catch { setAccessToken(null); queryClient.setQueryData(['session'], null); return false }
  }, [queryClient])

  useEffect(() => {
    const clearSession = () => queryClient.setQueryData(['session'], null)
    window.addEventListener('weebspace:session-expired', clearSession)
    return () => window.removeEventListener('weebspace:session-expired', clearSession)
  }, [queryClient])

  const login = useCallback(async (identifier: string, password: string) => {
    const result = await api.auth.login({ identifier, password })
    setAccessToken(result.accessToken)
    queryClient.setQueryData<User | null>(['session'], result.user)
  }, [queryClient])

  const register = useCallback(async (values: { name: string; username: string; email: string; password: string }) => {
    await api.auth.register(values)
    await login(values.email, values.password)
  }, [login])

  const logout = useCallback(async () => {
    try { await api.auth.logout() } finally { setAccessToken(null); queryClient.setQueryData(['session'], null) }
  }, [queryClient])

  const value = useMemo(() => ({ user, loading, login, register, logout, refreshUser }), [user, loading, login, register, logout, refreshUser])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
