<template>
  <q-page class="page-wrap">
    <section class="content-header">
      <q-btn flat no-caps icon="arrow_back" :label="$t('home.title')" :to="{ name: 'home' }" />
    </section>
    <PollsCard :poll-id="Number($route.params.id)" />
  </q-page>
</template>

<script>
import { defineComponent } from 'vue'
import PollsCard from 'components/PollsCard.vue'

export default defineComponent({
  name: 'PollPage',
  components: { PollsCard },
})
</script>
