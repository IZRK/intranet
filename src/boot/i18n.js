import { defineBoot } from '#q-app/wrappers'
import { createI18n } from 'vue-i18n'
import messages from 'src/i18n'

export const DEFAULT_LOCALE = 'sl-SI'
const STORAGE_KEY = 'izrk.lang'

function normalizeLocale(value) {
  return value === 'en' || value === 'en-US' ? 'en-US' : 'sl-SI'
}

export function getStoredLocale() {
  if (typeof window === 'undefined') {
    return DEFAULT_LOCALE
  }

  return normalizeLocale(window.localStorage.getItem(STORAGE_KEY) || DEFAULT_LOCALE)
}

export function setStoredLocale(locale) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, normalizeLocale(locale))
  }
}

export const i18n = createI18n({
  locale: getStoredLocale(),
  fallbackLocale: 'en-US',
  globalInjection: true,
  legacy: false,
  messages,
})

export function setLocale(locale) {
  const normalized = normalizeLocale(locale)
  i18n.global.locale.value = normalized
  setStoredLocale(normalized)
  return normalized
}

export default defineBoot(({ app }) => {
  app.use(i18n)
})
