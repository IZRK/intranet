<template>
  <q-page class="page-wrap">
    <section class="content-header">
      <div class="content-header-row">
        <div>
          <h1 class="page-title">{{ $t('profile.title') }}</h1>
          <p class="page-lead">{{ $t('profile.lead') }}</p>
        </div>
      </div>
    </section>

    <q-card flat bordered class="panel-card">
      <q-card-section v-if="loadError">
        <q-banner rounded class="status-banner status-banner-danger">
          {{ $t('profile.loadFailed') }}
        </q-banner>
      </q-card-section>

      <q-card-section class="q-gutter-md">
        <q-input v-model="form.first_name" outlined :label="$t('profile.firstName')" />
        <q-input v-model="form.last_name" outlined :label="$t('profile.lastName')" />
        <q-input v-model="form.email" outlined type="email" :label="$t('profile.email')" />
        <q-input v-model="form.phone_number" outlined :label="$t('profile.phone')" />
        <q-input v-model="form.mobile_number" outlined :label="$t('profile.mobile')" />
        <q-input
          v-model="form.password"
          outlined
          type="password"
          autocomplete="new-password"
          :label="$t('profile.password')"
          :hint="$t('profile.passwordHint')"
        />
        <q-btn
          unelevated
          color="primary"
          :label="$t('profile.save')"
          :loading="saving"
          @click="save"
        />
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script>
import { defineComponent } from 'vue'
import { Notify } from 'quasar'
import { api } from 'boot/axios'
import { useAuthStore } from 'stores/auth-store'

function profileForm(user = {}) {
  return {
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    email: user.email || '',
    phone_number: user.phone_number || '',
    mobile_number: user.mobile_number || '',
    password: '',
  }
}

export default defineComponent({
  name: 'ProfilePage',
  data() {
    const auth = useAuthStore()
    return {
      auth,
      saving: false,
      loadError: false,
      form: profileForm(auth.user || {}),
    }
  },
  async mounted() {
    await this.loadProfile()
  },
  methods: {
    async loadProfile() {
      this.loadError = false

      try {
        const { data } = await api.get('profile')
        this.auth.applySession({ user: data.user })
        this.form = profileForm(data.user)
      } catch {
        this.loadError = true
      }
    },
    async save() {
      this.saving = true

      try {
        const payload = { ...this.form }
        const { data } = await api.post('profile/update', payload)
        this.auth.applySession(data)
        this.form = profileForm(data.user)
        Notify.create({ type: 'positive', message: this.$t('profile.saveSuccess') })
      } catch {
        Notify.create({ type: 'negative', message: this.$t('profile.saveFailed') })
      } finally {
        this.saving = false
      }
    },
  },
})
</script>
