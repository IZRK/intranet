<template>
  <q-page class="auth-page">
    <div class="auth-card-wrap">
      <q-card flat bordered class="auth-card">
        <q-card-section class="auth-card-section">
          <div class="auth-topbar">
            <div>
              <img :src="logoSrc" alt="IZRK" class="auth-logo" />
              <div class="auth-overline">{{ $t('auth.loginOverline') }}</div>
              <h1 class="auth-title">{{ $t('auth.loginTitle') }}</h1>
            </div>
            <div class="auth-topbar-actions">
              <ThemeToggle />
              <LanguageSwitcher class="language-switcher" />
            </div>
          </div>
          <p class="auth-text">
            {{ showingResetRequest ? $t('auth.resetRequestText') : $t('auth.loginText') }}
          </p>
          <AppStoreLinks variant="banners" class="auth-store-links" />
        </q-card-section>
        <q-card-section class="auth-card-section">
          <div class="auth-form-shell">
            <transition name="auth-fade" mode="out-in">
              <form v-if="!showingResetRequest" key="login" @submit.prevent="submit">
                <div class="q-gutter-md">
                  <q-input v-model="email" outlined :label="$t('auth.email')" type="email" autocomplete="username" />
                  <q-input
                    v-model="password"
                    outlined
                    :label="$t('auth.password')"
                    type="password"
                    autocomplete="current-password"
                  />
                </div>
                <q-btn
                  type="submit"
                  unelevated
                  color="primary"
                  class="full-width auth-submit q-mt-md"
                  :label="$t('auth.loginButton')"
                  :loading="auth.loading"
                />
                <button type="button" class="auth-link auth-link-spaced" @click="showResetRequest">
                  {{ $t('auth.resetTitle') }}
                </button>
              </form>
              <form v-else key="reset-request" @submit.prevent="requestReset">
                <div class="q-gutter-md">
                  <q-input
                    v-model="resetEmail"
                    outlined
                    :label="$t('auth.resetEmail')"
                    type="email"
                    autocomplete="email"
                  />
                </div>
                <q-btn
                  type="submit"
                  unelevated
                  color="primary"
                  class="full-width auth-submit q-mt-md"
                  :label="$t('auth.resetButton')"
                  :loading="auth.loading"
                />
                <button type="button" class="auth-link auth-link-secondary auth-link-spaced" @click="showLogin">
                  {{ $t('auth.backToLogin') }}
                </button>
              </form>
            </transition>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script>
import { defineComponent } from 'vue'
import { Notify } from 'quasar'
import { i18n } from 'boot/i18n'
import { useAuthStore } from 'stores/auth-store'
import AppStoreLinks from 'components/AppStoreLinks.vue'
import LanguageSwitcher from 'components/LanguageSwitcher.vue'
import ThemeToggle from 'components/ThemeToggle.vue'

export default defineComponent({
  name: 'LoginPage',
  components: {
    AppStoreLinks,
    LanguageSwitcher,
    ThemeToggle,
  },
  data() {
    return {
      auth: useAuthStore(),
      logoSrc: `${import.meta.env.BASE_URL}izrk.webp`,
      email: '',
      password: '',
      resetEmail: '',
      showingResetRequest: false,
    }
  },
  methods: {
    showResetRequest() {
      this.resetEmail = this.email
      this.showingResetRequest = true
    },
    showLogin() {
      this.showingResetRequest = false
    },
    async submit() {
      try {
        await this.auth.login({ email: this.email, pass: this.password })
        Notify.create({ type: 'positive', message: i18n.global.t('auth.loginSuccess') })
        this.$router.push('/')
      } catch {
        Notify.create({ type: 'negative', message: i18n.global.t('auth.loginFailed') })
      }
    },
    async requestReset() {
      try {
        await this.auth.requestReset(this.resetEmail)
        Notify.create({ type: 'positive', message: i18n.global.t('auth.resetRequestSuccess') })
        this.showingResetRequest = false
      } catch {
        Notify.create({ type: 'negative', message: i18n.global.t('auth.resetRequestFailed') })
      }
    },
  },
})
</script>
