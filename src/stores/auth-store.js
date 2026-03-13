import { defineStore } from 'pinia'
import { api } from 'boot/axios'
import { useLanguageStore } from 'stores/language-store'
import { useThemeStore } from 'stores/theme-store'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: typeof window !== 'undefined' ? window.localStorage.getItem('izrk.jwt') : null,
    user: null,
    loading: false,
  }),

  getters: {
    isAuthenticated: (state) => Boolean(state.token && state.user),
  },

  actions: {
    async login(credentials) {
      this.loading = true
      try {
        const { data } = await api.post('auth/login', credentials)
        this.token = data.token
        this.user = data.user
        window.localStorage.setItem('izrk.jwt', data.token)
        useLanguageStore().applyBackendLanguage(data.user.lang)
        useThemeStore().applyBackendTheme(data.user.theme)
        return data
      } finally {
        this.loading = false
      }
    },

    async bootstrap() {
      if (!this.token) {
        return null
      }

      this.loading = true
      try {
        const { data } = await api.get('auth/me')
        this.user = data.user
        useLanguageStore().applyBackendLanguage(data.user.lang)
        useThemeStore().applyBackendTheme(data.user.theme)
        return data.user
      } catch {
        this.clear()
        return null
      } finally {
        this.loading = false
      }
    },

    async requestReset(email) {
      this.loading = true
      try {
        return await api.post('auth/request_reset', { email })
      } finally {
        this.loading = false
      }
    },

    async resetPassword(payload) {
      this.loading = true
      try {
        return await api.post('auth/reset_password', payload)
      } finally {
        this.loading = false
      }
    },

    clear() {
      this.token = null
      this.user = null
      window.localStorage.removeItem('izrk.jwt')
    },
  },
})
