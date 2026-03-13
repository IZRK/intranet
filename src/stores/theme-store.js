import { defineStore } from 'pinia'
import { Dark } from 'quasar'
import { api } from 'boot/axios'

const STORAGE_KEY = 'izrk.theme'

function normalizeTheme(value) {
  return value === 'light' ? 'light' : 'dark'
}

function getStoredTheme() {
  if (typeof window === 'undefined') {
    return 'dark'
  }

  return normalizeTheme(window.localStorage.getItem(STORAGE_KEY) || 'dark')
}

function persistTheme(theme) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, normalizeTheme(theme))
  }
}

export const useThemeStore = defineStore('theme', {
  state: () => ({
    theme: getStoredTheme(),
  }),

  getters: {
    isDark: (state) => state.theme === 'dark',
  },

  actions: {
    applyTheme(theme) {
      this.theme = normalizeTheme(theme)
      Dark.set(this.theme === 'dark')
      persistTheme(this.theme)
      return this.theme
    },

    initialize(theme) {
      return this.applyTheme(theme || this.theme)
    },

    applyBackendTheme(theme) {
      return this.applyTheme(theme)
    },

    async toggleTheme(isAuthenticated) {
      const nextTheme = this.theme === 'dark' ? 'light' : 'dark'
      this.applyTheme(nextTheme)

      if (isAuthenticated) {
        await api.post('auth/set_theme', { theme: nextTheme })
      }

      return nextTheme
    },
  },
})
