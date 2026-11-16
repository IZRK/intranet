<template>
  <q-card flat bordered class="panel-card">
    <q-card-section class="row items-center justify-between">
      <div class="panel-title">{{ $t('polls.title') }}</div>
      <div>
        <q-btn flat round dense color="primary" icon="refresh" :loading="loading" :aria-label="$t('polls.refresh')" @click="load">
          <q-tooltip>{{ $t('polls.refresh') }}</q-tooltip>
        </q-btn>
        <q-btn v-if="!pollId && (auth.isIzrk || auth.isAdmin)" flat round dense color="primary" icon="add" :aria-label="$t('polls.create')" @click="openCreate">
          <q-tooltip>{{ $t('polls.create') }}</q-tooltip>
        </q-btn>
      </div>
    </q-card-section>
    <q-card-section v-if="loadError" class="q-pt-none">
      <q-banner rounded class="status-banner status-banner-danger">{{ $t('polls.loadFailed') }}</q-banner>
    </q-card-section>
    <q-card-section v-else-if="!loading && !items.length" class="q-pt-none">
      <div class="text-grey">{{ $t('polls.empty') }}</div>
    </q-card-section>
    <template v-for="poll in items" :key="poll.id">
      <q-separator />
      <q-card-section>
        <div class="row items-start no-wrap q-gutter-sm">
          <router-link :to="{ name: 'poll', params: { id: poll.id } }" class="col text-subtitle1 text-weight-medium poll-text poll-title">{{ poll.question }}</router-link>
          <q-btn v-if="poll.can_edit" flat round dense color="primary" icon="how_to_vote" :aria-label="$t('polls.voterResults')" @click="openResults(poll)">
            <q-tooltip>{{ $t('polls.voterResults') }}</q-tooltip>
          </q-btn>
          <q-btn v-if="poll.can_edit" flat round dense color="primary" icon="edit" :aria-label="$t('polls.edit')" :disable="saving || votingId === poll.id" @click="openEdit(poll)">
            <q-tooltip>{{ $t('polls.edit') }}</q-tooltip>
          </q-btn>
          <q-btn v-if="poll.can_delete" flat round dense color="negative" icon="delete_outline" :aria-label="$t('polls.delete')" :loading="deletingId === poll.id" :disable="deletingId !== null || votingId === poll.id" @click="confirmDelete(poll)">
            <q-tooltip>{{ $t('polls.delete') }}</q-tooltip>
          </q-btn>
        </div>
        <div v-if="poll.has_voted && editingVoteId !== poll.id" class="q-mt-sm" aria-live="polite">
          <div class="text-caption q-mb-sm">{{ $t('polls.voted') }} · {{ $t('polls.total', { count: poll.total_votes }) }}</div>
          <div v-for="option in poll.options" :key="option.id" class="q-mb-md">
            <div class="row items-start justify-between q-mb-xs">
              <span class="poll-option-label poll-text">
                {{ option.label }}
                <q-icon v-if="poll.voted_option_ids.includes(option.id)" name="check_circle" color="primary" :aria-label="$t('polls.yourVote')" />
              </span>
              <span class="text-caption">{{ option.votes }} · {{ percentage(poll, option) }}%</span>
            </div>
            <q-linear-progress :value="poll.total_votes ? option.votes / poll.total_votes : 0" rounded color="primary" :aria-label="option.label" />
          </div>
          <div v-if="poll.allow_multiple" class="text-caption q-mb-sm">{{ $t('polls.multipleResults') }}</div>
          <q-btn flat no-caps color="primary" icon="edit" :label="$t('polls.changeAnswer')" @click="editVote(poll)" />
        </div>
        <q-form v-else @submit="vote(poll)">
          <q-option-group :model-value="selections[poll.id] ?? (poll.allow_multiple ? [] : null)" @update:model-value="selections[poll.id] = $event" :options="poll.options.map(option => ({ label: option.label, value: option.id }))" :type="poll.allow_multiple ? 'checkbox' : 'radio'" color="primary" class="q-my-sm poll-text" :disable="votingId === poll.id" />
          <div class="text-caption q-mb-sm">{{ $t(poll.allow_multiple ? 'polls.multipleInstructions' : 'polls.instructions') }}</div>
          <q-btn unelevated no-caps color="primary" type="submit" :label="$t(poll.has_voted ? 'polls.saveAnswer' : 'polls.vote')" :disable="!hasSelection(poll)" :loading="votingId === poll.id" />
          <q-btn v-if="poll.has_voted" flat no-caps :label="$t('polls.cancel')" :disable="votingId === poll.id" @click="editingVoteId = null" />
        </q-form>
      </q-card-section>
    </template>

    <q-dialog v-model="resultsDialog">
      <q-card class="poll-results-dialog">
        <q-card-section class="row items-center no-wrap">
          <div class="col text-h6">{{ $t('polls.voterResults') }}</div>
          <q-btn v-close-popup flat round icon="close" :aria-label="$t('polls.cancel')" />
        </q-card-section>
        <q-card-section class="q-pt-none">
          <div class="poll-results-question poll-text">{{ resultsQuestion }}</div>
          <q-spinner v-if="resultsLoading" color="primary" />
          <div v-else-if="resultsError" role="alert">{{ $t('polls.resultsFailed') }}</div>
          <template v-else-if="voters.length">
            <div class="text-caption q-mb-md">{{ $t('polls.total', { count: voters.length }) }}</div>
            <ul class="poll-voter-list">
              <li v-for="voter in voters" :key="voter.user_id" class="poll-voter-card">
                <div class="poll-voter-name">
                  <q-icon name="person_outline" color="primary" size="22px" aria-hidden="true" />
                  <span>{{ voter.name || $t('polls.unnamedVoter', { id: voter.user_id }) }}</span>
                </div>
                <div class="poll-voter-answer-label">{{ $t('polls.selectedAnswers') }}</div>
                <ul class="poll-voter-answers">
                  <li v-for="option in voter.options" :key="option.id" class="poll-voter-answer">
                    <q-icon name="check_circle" color="primary" size="18px" aria-hidden="true" />
                    <span class="poll-text">{{ option.label }}</span>
                  </li>
                </ul>
              </li>
            </ul>
          </template>
          <div v-else>{{ $t('polls.noVotes') }}</div>
        </q-card-section>
      </q-card>
    </q-dialog>
    <q-dialog v-model="createDialog" :persistent="saving">
      <q-card class="poll-create-dialog">
        <q-form @submit="savePoll">
          <q-card-section class="text-h6">{{ $t(editingId ? 'polls.edit' : 'polls.create') }}</q-card-section>
          <q-card-section class="q-gutter-md">
            <q-input v-model="question" outlined autogrow autofocus maxlength="500" :label="$t('polls.question')" :rules="[value => !!value.trim() || $t('polls.required')]" :disable="saving" />
            <q-toggle v-model="allowMultiple" :label="$t('polls.allowMultiple')" :disable="saving || choicesLocked" />
            <q-banner v-if="choicesLocked" rounded class="banner-info">{{ $t('polls.choicesLocked') }}</q-banner>
            <div v-for="(_, index) in options" :key="index" class="row items-start no-wrap q-gutter-sm">
              <q-input v-model="options[index]" outlined autogrow maxlength="255" class="col" :label="$t('polls.option', { number: index + 1 })" :rules="[value => !!value.trim() || $t('polls.required')]" :disable="saving || choicesLocked" />
              <q-btn v-if="options.length > 2 && !choicesLocked" flat round icon="close" :aria-label="$t('polls.removeOption')" :disable="saving" @click="options.splice(index, 1)" />
            </div>
            <q-btn flat no-caps icon="add" color="primary" :label="$t('polls.addOption')" :disable="options.length >= 10 || saving || choicesLocked" @click="options.push('')" />
          </q-card-section>
          <q-card-actions align="right">
            <q-btn v-close-popup flat no-caps :label="$t('polls.cancel')" :disable="saving" />
            <q-btn unelevated no-caps color="primary" type="submit" :label="$t(editingId ? 'polls.save' : 'polls.create')" :loading="saving" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </q-card>
</template>

<script>
import { defineComponent } from 'vue'
import { Dialog, Notify } from 'quasar'
import { api } from 'boot/axios'
import { useAuthStore } from 'stores/auth-store'

export default defineComponent({
  name: 'PollsCard',
  props: { pollId: { type: Number, default: null } },
  data() {
    return {
      auth: useAuthStore(),
      items: [], selections: {}, loading: false, loadError: false, votingId: null, deletingId: null,
      resultsDialog: false, resultsLoading: false, resultsError: false, resultsQuestion: '', voters: [],
      createDialog: false, saving: false, question: '', options: ['', ''],
      editingId: null, allowMultiple: false, choicesLocked: false, editingVoteId: null,
    }
  },
  mounted() {
    void this.load()
  },
  watch: {
    pollId() { this.selections = {}; this.editingVoteId = null; void this.load() },
  },
  methods: {
    async load() {
      this.loading = true
      this.loadError = false
      try {
        const { data } = this.pollId
          ? await api.get('polls/get', { params: { poll_id: this.pollId } })
          : await api.get('polls/list')
        this.items = this.pollId ? [data.item] : data.items || []
      } catch {
        this.loadError = true
      } finally {
        this.loading = false
      }
    },
    async openResults(poll) {
      this.resultsDialog = true
      this.resultsQuestion = poll.question
      this.voters = []
      this.resultsError = false
      this.resultsLoading = true
      try {
        const { data } = await api.get('polls/results', { params: { poll_id: poll.id } })
        this.voters = data.voters
      } catch {
        this.resultsError = true
      } finally {
        this.resultsLoading = false
      }
    },
    openCreate() {
      this.editingId = null
      this.allowMultiple = false
      this.choicesLocked = false
      this.question = ''
      this.options = ['', '']
      this.createDialog = true
    },
    openEdit(poll) {
      this.editingId = poll.id
      this.question = poll.question
      this.options = poll.options.map(option => option.label)
      this.allowMultiple = poll.allow_multiple
      this.choicesLocked = poll.choices_locked
      this.createDialog = true
    },
    async savePoll() {
      if (this.saving) return
      const options = this.options.map(option => option.trim())
      if (new Set(options.map(option => option.toLowerCase())).size !== options.length) {
        Notify.create({ type: 'negative', message: this.$t('polls.distinctOptions') })
        return
      }
      this.saving = true
      try {
        const { data } = await api.post(this.editingId ? 'polls/update' : 'polls/create', {
          poll_id: this.editingId, question: this.question.trim(), options, allow_multiple: this.allowMultiple,
        })
        if (this.editingId) {
          this.items = this.items.map(item => item.id === data.item.id ? data.item : item)
          delete this.selections[data.item.id]
          this.editingVoteId = null
        } else {
          this.items.unshift(data.item)
        }
        this.loadError = false
        this.createDialog = false
        Notify.create({ type: 'positive', message: this.$t(this.editingId ? 'polls.updated' : 'polls.created') })
      } catch (error) {
        if (error.response?.data?.error?.code === 'poll_choices_locked') {
          Notify.create({ type: 'negative', message: this.$t('polls.choicesLocked') })
        } else {
          Notify.create({ type: 'negative', message: this.$t(this.editingId ? 'polls.updateFailed' : 'polls.createFailed') })
        }
      } finally {
        this.saving = false
      }
    },
    hasSelection(poll) {
      const selected = this.selections[poll.id]
      return poll.allow_multiple ? Array.isArray(selected) && selected.length > 0 : !!selected
    },
    editVote(poll) {
      this.selections[poll.id] = poll.allow_multiple ? [...poll.voted_option_ids] : poll.voted_option_ids[0]
      this.editingVoteId = poll.id
    },
    async vote(poll) {
      if (this.votingId !== null || !this.hasSelection(poll)) return
      this.votingId = poll.id
      try {
        const { data } = await api.post('polls/vote', { poll_id: poll.id, option_ids: poll.allow_multiple ? this.selections[poll.id] : [this.selections[poll.id]] })
        this.items = this.items.map(item => item.id === poll.id ? data.item : item)
        this.editingVoteId = null
      } catch (error) {
        if (error.response?.data?.error?.code === 'poll_already_voted') {
          await this.load()
          Notify.create({ type: 'info', message: this.$t('polls.alreadyVoted') })
        } else {
          Notify.create({ type: 'negative', message: this.$t('polls.voteFailed') })
        }
      } finally {
        this.votingId = null
      }
    },
    confirmDelete(poll) {
      if (this.deletingId !== null) return
      Dialog.create({
        title: this.$t('polls.delete'),
        message: this.$t('polls.deleteConfirm', { question: poll.question }),
        cancel: { label: this.$t('polls.cancel'), flat: true },
        ok: { label: this.$t('polls.delete'), color: 'negative' },
      }).onOk(() => { void this.deletePoll(poll) })
    },
    async deletePoll(poll) {
      if (this.deletingId !== null) return
      this.deletingId = poll.id
      try {
        await api.post('polls/delete', { poll_id: poll.id })
        this.items = this.items.filter(item => item.id !== poll.id)
        delete this.selections[poll.id]
        Notify.create({ type: 'positive', message: this.$t('polls.deleted') })
        if (this.pollId) void this.$router.push({ name: 'home' })
      } catch {
        Notify.create({ type: 'negative', message: this.$t('polls.deleteFailed') })
      } finally {
        this.deletingId = null
      }
    },
    percentage(poll, option) {
      return poll.total_votes ? Math.round(option.votes * 100 / poll.total_votes) : 0
    },
  },
})
</script>

<style scoped>
.poll-results-dialog {
  width: 720px;
  max-width: 95vw;
  color: var(--app-text);
  background: var(--app-surface);
}
.poll-results-question {
  font-size: 1.1rem;
  line-height: 1.5;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid color-mix(in srgb, var(--app-text) 15%, transparent);
}
.poll-voter-list, .poll-voter-answers {
  list-style: none;
  margin: 0;
  padding: 0;
}
.poll-voter-list {
  display: grid;
  gap: 12px;
}
.poll-voter-card {
  padding: 16px;
  border: 1px solid color-mix(in srgb, var(--app-text) 16%, transparent);
  border-radius: 12px;
  background: color-mix(in srgb, var(--app-text) 3%, transparent);
}
.poll-voter-name {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 1rem;
  font-weight: 600;
  overflow-wrap: anywhere;
}
.poll-voter-answer-label {
  margin: 12px 0 6px;
  font-size: 0.75rem;
  color: color-mix(in srgb, var(--app-text) 70%, transparent);
}
.poll-voter-answers {
  display: grid;
  gap: 8px;
}
.poll-voter-answer {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--app-primary) 9%, transparent);
  line-height: 1.5;
}
.poll-voter-answer .q-icon {
  margin-top: 3px;
  flex-shrink: 0;
}

.poll-title {
  color: inherit;
  text-decoration: none;
}
.poll-title:hover {
  text-decoration: underline;
}
.poll-create-dialog {
  width: 560px;
  max-width: 95vw;
}
.poll-text {
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}
.poll-option-label {
  flex: 1;
  min-width: 0;
  padding-right: 12px;
}
</style>
