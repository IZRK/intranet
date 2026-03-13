<template>
  <q-btn
    flat
    round
    dense
    class="theme-toggle"
    :icon="toggleIcon"
    :aria-label="toggleLabel"
    :title="toggleLabel"
    @click="toggleTheme"
  />
</template>

<script>
import { defineComponent } from 'vue'
import { useAuthStore } from 'stores/auth-store'
import { useThemeStore } from 'stores/theme-store'

export default defineComponent({
  name: 'ThemeToggle',
  data() {
    return {
      auth: useAuthStore(),
      theme: useThemeStore(),
    }
  },
  computed: {
    toggleIcon() {
      return this.theme.isDark ? 'light_mode' : 'dark_mode'
    },
    toggleLabel() {
      return this.theme.isDark ? this.$t('app.themeLight') : this.$t('app.themeDark')
    },
  },
  methods: {
    async toggleTheme() {
      const nextTheme = await this.theme.toggleTheme(this.auth.isAuthenticated)
      if (this.auth.isAuthenticated && this.auth.user) {
        this.auth.user.theme = nextTheme
      }
    },
  },
})
</script>
