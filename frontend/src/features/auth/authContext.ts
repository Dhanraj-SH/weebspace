import { createContext } from 'react'
import type { User } from '../../lib/api'

export type AuthContextValue = { user: User | null; loading: boolean; login: (identifier: string, password: string) => Promise<void>; register: (values: { name: string; username: string; email: string; password: string }) => Promise<void>; logout: () => Promise<void>; refreshUser: () => Promise<boolean> }
export const AuthContext = createContext<AuthContextValue | null>(null)
