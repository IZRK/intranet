<template>
  <div v-if="showLinks" :class="rootClass">
    <div v-if="variant === 'banners'">
      <div v-if="showTitle" class="store-links-title">{{ $t('stores.title') }}</div>
      <div class="store-banner-list">
        <a
          v-for="store in stores"
          :key="store.key"
          class="store-banner-link"
          :href="store.href"
          target="_blank"
          rel="noopener noreferrer"
          :aria-label="$t(store.ariaLabel)"
        >
          <img :src="store.bannerSrc" :alt="$t(store.label)" class="store-banner-image" />
        </a>
      </div>
    </div>
    <div v-else class="store-icon-list" :aria-label="$t('stores.title')">
      <q-btn
        v-for="store in stores"
        :key="store.key"
        flat
        round
        dense
        class="store-icon-btn"
        :href="store.href"
        target="_blank"
        rel="noopener noreferrer"
        :icon="store.icon"
        :aria-label="$t(store.ariaLabel)"
        :title="$t(store.label)"
      >
        <q-tooltip>{{ $t(store.label) }}</q-tooltip>
      </q-btn>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import { Capacitor } from '@capacitor/core'

const APP_STORE_URL = 'https://apps.apple.com/us/app/izrk-intranet/id6760788413'
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=intranet.izrk'

export default defineComponent({
  name: 'AppStoreLinks',
  props: {
    variant: {
      type: String,
      default: 'icons',
    },
    showTitle: {
      type: Boolean,
      default: true,
    },
  },
  computed: {
    rootClass() {
      return this.variant === 'banners' ? 'store-links store-links-banners' : 'store-links store-links-icons'
    },
    showLinks() {
      return !Capacitor.isNativePlatform()
    },
    stores() {
      const baseUrl = import.meta.env.BASE_URL

      return [
        {
          key: 'app-store',
          href: APP_STORE_URL,
          label: 'stores.appStore',
          ariaLabel: 'stores.appStoreAria',
          bannerSrc: `${baseUrl}appstore.webp`,
          icon: 'apple',
        },
        {
          key: 'google-play',
          href: PLAY_STORE_URL,
          label: 'stores.googlePlay',
          ariaLabel: 'stores.googlePlayAria',
          bannerSrc: `${baseUrl}play.webp`,
          icon: 'android',
        },
      ]
    },
  },
})
</script>
