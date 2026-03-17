<template>
  <q-layout view="hHh lpR fFf" class="shell">
    <q-header bordered class="app-header">
      <q-toolbar class="app-toolbar">
        <div class="brand">
          <img :src="logoSrc" alt="IZRK" class="brand-logo" />
          <div class="brand-text">
            <div class="brand-title">{{ $t('app.brand') }}</div>
            <div class="brand-subtitle">{{ $t('app.institute') }}</div>
          </div>
        </div>
        <div class="toolbar-spacer" />
        <div class="user-block">
          <ThemeToggle />
          <LanguageSwitcher class="language-switcher app-language-switcher" />
          <q-btn flat round dense icon="more_horiz" class="header-menu-btn" :aria-label="$t('app.menu')" :title="$t('app.menu')">
            <q-tooltip>{{ $t('app.menu') }}</q-tooltip>
            <q-menu anchor="bottom right" self="top right">
              <q-list dense class="header-menu-list">
                <q-item v-if="auth.user?.name">
                  <q-item-section>{{ auth.user?.name }}</q-item-section>
                </q-item>
                <q-item clickable v-close-popup :to="{ name: 'profile' }">
                  <q-item-section>{{ $t('app.profile') }}</q-item-section>
                </q-item>
                <q-item v-if="auth.isAdmin" clickable v-close-popup :to="{ name: 'users-admin' }">
                  <q-item-section>{{ $t('app.usersAdmin') }}</q-item-section>
                </q-item>
                <q-separator />
                <q-item clickable v-close-popup @click="logout">
                  <q-item-section>{{ $t('app.logout') }}</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </div>
      </q-toolbar>
      <q-tabs align="left" inline-label class="app-tabs">
        <q-route-tab icon="home" :label="$t('app.nav.home')" to="/" exact />
        <q-route-tab icon="campaign" :label="$t('app.nav.messaging')" to="/obvescanje" />
        <q-route-tab icon="event_available" :label="$t('app.nav.reservations')" to="/rezervacije" />
        <q-tab icon="folder_copy" :label="$t('app.nav.documents')" disable aria-disabled="true">
          <q-tooltip>{{ $t('app.nav.comingSoon') }}</q-tooltip>
        </q-tab>
      </q-tabs>
    </q-header>

    <q-page-container class="page-container">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import { defineComponent } from 'vue'
import { useAuthStore } from 'stores/auth-store'
import LanguageSwitcher from 'components/LanguageSwitcher.vue'
import ThemeToggle from 'components/ThemeToggle.vue'

export default defineComponent({
  name: 'MainLayout',
  components: {
    LanguageSwitcher,
    ThemeToggle,
  },
  data() {
    return {
      auth: useAuthStore(),
      logoSrc: `${import.meta.env.BASE_URL}izrk.webp`,
    }
  },
  methods: {
    logout() {
      this.auth.clear()
      this.$router.push({ name: 'login' })
    },
  },
})
</script>
