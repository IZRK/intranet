<template>
  <q-layout view="hHh lpR fFf" class="auth-shell">
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'AuthLayout',
})
</script>
