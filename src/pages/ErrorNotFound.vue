<template>
  <q-page class="error-page">
    <div class="error-content">
      <div class="error-code" aria-hidden="true">404</div>
      <h1 class="error-title">{{ $t('notFound.title') }}</h1>
      <p class="error-text">{{ $t('notFound.text') }}</p>
      <q-btn unelevated color="primary" :label="$t('notFound.home')" to="/" no-caps />
    </div>
  </q-page>
</template>

<script setup>
</script>

<style scoped>
.error-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 24px;
}

.error-content {
  text-align: center;
}

.error-code {
  font-size: clamp(6rem, 20vw, 12rem);
  font-weight: 700;
  line-height: 1;
  opacity: 0.12;
  color: var(--app-text, #1f2933);
  user-select: none;
}

.error-title {
  margin: 0 0 8px;
  font-size: 1.5rem;
  font-weight: 700;
}

.error-text {
  margin: 0 0 24px;
  color: var(--app-muted, #52606d);
}
</style>
