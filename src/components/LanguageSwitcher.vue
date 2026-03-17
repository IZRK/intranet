<template>
  <q-btn
    flat
    no-caps
    unelevated
    class="language-toggle"
    :label="nextLocaleLabel"
    :aria-label="switchLanguageLabel"
    :title="switchLanguageLabel"
    @click="toggleLanguage"
  >
    <q-tooltip>{{ switchLanguageLabel }}</q-tooltip>
  </q-btn>
</template>

<script>
import { defineComponent } from 'vue'
import { useAuthStore } from 'stores/auth-store'
import { useLanguageStore } from 'stores/language-store'

export default defineComponent({
  name: 'LanguageSwitcher',
  data() {
    return {
      auth: useAuthStore(),
      language: useLanguageStore(),
    }
  },
  computed: {
    nextLocale() {
      return this.language.locale === 'sl-SI' ? 'en-US' : 'sl-SI'
    },
    nextLocaleLabel() {
      return this.nextLocale === 'en-US' ? 'EN' : 'SL'
    },
    nextLanguageLabel() {
      return this.nextLocale === 'en-US' ? this.$t('app.languages.en') : this.$t('app.languages.sl')
    },
    switchLanguageLabel() {
      return this.$t('app.changeLanguage', { language: this.nextLanguageLabel })
    },
  },
  methods: {
    async toggleLanguage() {
      const locale = this.nextLocale
      await this.language.changeLanguage(locale, this.auth.isAuthenticated)
      if (this.auth.isAuthenticated && this.auth.user) {
        this.auth.user.lang = locale === 'en-US' ? 'en' : 'sl'
      }
    },
  },
})
</script>
