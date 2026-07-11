import { create } from 'zustand'

type Theme = 'light' | 'dark'

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

interface ThemeState {
  theme: Theme
  toggleTheme: () => void
}

const initialTheme: Theme = (localStorage.getItem('carparkin_theme') as Theme) || 'light'
applyTheme(initialTheme)

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: initialTheme,
  toggleTheme: () => {
    const next: Theme = get().theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem('carparkin_theme', next)
    applyTheme(next)
    set({ theme: next })
  },
}))
