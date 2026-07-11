import { create } from 'zustand'
import type { AuthUser } from '../api/auth.api'
import { useFavoritesStore } from './favoritesStore'

interface AuthState {
  user: AuthUser | null
  token: string | null
  setAuth: (user: AuthUser, token: string) => void
  updateUser: (patch: Partial<AuthUser>) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: JSON.parse(localStorage.getItem('carparkin_user') || 'null'),
  token: localStorage.getItem('carparkin_token'),
  setAuth: (user, token) => {
    localStorage.setItem('carparkin_token', token)
    localStorage.setItem('carparkin_user', JSON.stringify(user))
    set({ user, token })
  },
  updateUser: (patch) => {
    const current = get().user
    if (!current) return
    const next = { ...current, ...patch }
    localStorage.setItem('carparkin_user', JSON.stringify(next))
    set({ user: next })
  },
  logout: () => {
    useFavoritesStore.getState().reset()
    localStorage.removeItem('carparkin_token')
    localStorage.removeItem('carparkin_user')
    set({ user: null, token: null })
  },
}))
