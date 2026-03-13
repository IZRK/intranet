import { defineStore } from 'pinia'
import { api } from 'boot/axios'
import { getStoredLocale, setLocale } from 'boot/i18n'

const localeToBackend = {
  'sl-SI': 'sl',
  'en-US': 'en',
}

const backendToLocale = {
  sl: 'sl-SI',
  en: 'en-US',
}

export const useLanguageStore = defineStore('language', {
  state: () => ({
    locale: getStoredLocale(),
  }),

  getters: {
    options: () => [
      { labelKey: 'app.languages.sl', value: 'sl-SI' },
      { labelKey: 'app.languages.en', value: 'en-US' },
    ],
  },

  actions: {
    initialize(locale) {
      this.locale = setLocale(locale || this.locale)
    },

    applyBackendLanguage(lang) {
      const locale = backendToLocale[lang] || 'sl-SI'
      this.locale = setLocale(locale)
    },

    async changeLanguage(locale, isAuthenticated) {
      this.locale = setLocale(locale)

      if (isAuthenticated) {
        await api.post('auth/set_language', { lang: localeToBackend[this.locale] || 'sl' })
      }
    },
  },
})
