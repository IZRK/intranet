<template>
  <q-page class="auth-page">
    <div class="auth-card-wrap">
      <q-card flat bordered class="auth-card">
        <q-card-section class="auth-card-section">
          <div class="auth-topbar">
            <div>
              <div class="auth-overline">{{ $t('auth.resetOverline') }}</div>
              <h1 class="auth-title">{{ $t('auth.resetPageTitle') }}</h1>
            </div>
            <div class="auth-topbar-actions">
              <ThemeToggle />
              <LanguageSwitcher class="language-switcher" />
            </div>
          </div>
          <p class="auth-text">{{ $t('auth.resetPageText') }}</p>
        </q-card-section>
        <q-card-section class="auth-card-section q-gutter-md">
          <q-banner v-if="!token" rounded class="banner-info auth-banner">
            {{ $t('auth.invalidResetLink') }}
          </q-banner>
          <q-input
            v-model="email"
            outlined
            :label="$t('auth.email')"
            type="email"
            autocomplete="email"
            :readonly="Boolean($route.query.email)"
          />
          <q-input
            v-model="password"
            outlined
            :label="$t('auth.newPassword')"
            type="password"
            autocomplete="new-password"
          />
          <q-btn
            unelevated
            color="primary"
            class="auth-submit"
            :label="$t('auth.resetSave')"
            @click="submit"
            :disable="!token"
          />
          <button type="button" class="auth-link auth-link-secondary auth-link-spaced" @click="$router.push('/login')">
            {{ $t('auth.backToLogin') }}
          </button>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script>
import { defineComponent } from 'vue'
import { Notify } from 'quasar'
import { useAuthStore } from 'stores/auth-store'
import { i18n } from 'boot/i18n'
import LanguageSwitcher from 'components/LanguageSwitcher.vue'
import ThemeToggle from 'components/ThemeToggle.vue'

export default defineComponent({
  name: 'ResetPasswordPage',
  components: {
    LanguageSwitcher,
    ThemeToggle,
  },
  data() {
    return {
      auth: useAuthStore(),
      email: this.$route.query.email || '',
      token: this.$route.query.token || '',
      password: '',
    }
  },
  methods: {
    async submit() {
      try {
        await this.auth.resetPassword({ email: this.email, token: this.token, password: this.password })
        Notify.create({ type: 'positive', message: i18n.global.t('auth.resetPasswordSuccess') })
        this.$router.push('/login')
      } catch {
        Notify.create({ type: 'negative', message: i18n.global.t('auth.resetPasswordFailed') })
      }
    },
  },
})
</script>
