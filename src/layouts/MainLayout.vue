<template>
  <q-layout view="hHh lpR fFf" class="shell">
    <q-header bordered class="app-header">
      <q-toolbar class="app-toolbar">
        <div class="brand">
          <img :src="logoSrc" alt="IZRK" class="brand-logo" />
          <div class="brand-title">{{ $t('app.brand') }}</div>
          <div class="brand-subtitle">{{ $t('app.institute') }}</div>
        </div>
        <div class="toolbar-spacer" />
        <div class="user-block">
          <LanguageSwitcher class="language-switcher app-language-switcher" />
          <div class="user-name">{{ auth.user?.name }}</div>
          <q-btn flat no-caps color="primary" :label="$t('app.logout')" @click="logout" />
        </div>
      </q-toolbar>
      <q-tabs align="left" inline-label class="app-tabs">
        <q-route-tab icon="home" :label="$t('app.nav.home')" to="/" exact />
        <q-route-tab icon="campaign" :label="$t('app.nav.messaging')" to="/obvescanje" />
        <q-tab icon="event_available" :label="$t('app.nav.reservations')" disable aria-disabled="true">
          <q-tooltip>{{ $t('app.nav.comingSoon') }}</q-tooltip>
        </q-tab>
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

export default defineComponent({
  name: 'MainLayout',
  components: {
    LanguageSwitcher,
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
