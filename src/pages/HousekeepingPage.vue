<template>
  <q-page class="page-wrap">
    <section class="content-header users-admin-header">
      <div class="users-admin-header-row">
        <div>
          <h1 class="page-title">{{ $t('housekeeping.title') }}</h1>
        </div>
        <q-btn
          v-if="auth.isIzrk"
          flat
          dense
          round
          color="primary"
          icon="add_task"
          :aria-label="$t('housekeeping.newTodo')"
          @click="openCreateDialog"
        >
          <q-tooltip>{{ $t('housekeeping.newTodo') }}</q-tooltip>
        </q-btn>
      </div>
    </section>

    <q-card flat bordered class="panel-card housekeeping-card">
      <q-card-section v-if="loadError">
        <q-banner rounded class="status-banner status-banner-danger">
          {{ $t('housekeeping.loadFailed') }}
        </q-banner>
      </q-card-section>

      <q-inner-loading :showing="loading" />

      <q-card-section v-if="!loading && !loadError && !items.length">
        <q-banner rounded class="banner-info">
          {{ $t('housekeeping.noTodos') }}
        </q-banner>
      </q-card-section>

      <q-list v-else-if="!loadError" separator class="housekeeping-list">
        <q-item
          v-for="item in items"
          :key="item.id"
          class="housekeeping-item"
          :class="{ 'housekeeping-item-done': item.is_done }"
        >
          <q-item-section avatar top>
            <q-checkbox
              :model-value="item.is_done"
              :disable="!auth.isHousekeeper || statusSavingId === item.id"
              :aria-label="$t(item.is_done ? 'housekeeping.markOpen' : 'housekeeping.markDone')"
              @update:model-value="toggleDone(item, $event)"
            />
          </q-item-section>

          <q-item-section>
            <q-item-label class="housekeeping-title">{{ item.name }}</q-item-label>
            <q-item-label v-if="item.description" class="housekeeping-description">
              {{ item.description }}
            </q-item-label>
            <q-item-label caption class="housekeeping-meta">
              {{ $t('housekeeping.createdBy', { name: item.creator_name || $t('housekeeping.unknownCreator') }) }}
            </q-item-label>
            <div class="housekeeping-times">
              <span>{{ $t('housekeeping.createdAt', { date: formatDate(item.created_at) }) }}</span>
              <span>{{ $t('housekeeping.updatedAt', { date: formatDate(item.updated_at) }) }}</span>
              <span v-if="item.done_at">{{ $t('housekeeping.doneAt', { date: formatDate(item.done_at) }) }}</span>
            </div>
            <div v-if="item.housekeeper_notes" class="housekeeping-notes">
              <q-icon name="sticky_note_2" size="18px" />
              <span>{{ item.housekeeper_notes }}</span>
            </div>
          </q-item-section>

          <q-item-section side top>
            <div class="user-item-actions">
              <q-btn
                v-if="auth.isHousekeeper"
                flat
                dense
                round
                icon="edit_note"
                :aria-label="$t('housekeeping.editNotes')"
                @click="openStatusDialog(item)"
              >
                <q-tooltip>{{ $t('housekeeping.editNotes') }}</q-tooltip>
              </q-btn>
              <q-btn
                v-if="canEdit(item)"
                flat
                dense
                round
                icon="edit"
                :aria-label="$t('housekeeping.editTodo')"
                @click="startEdit(item)"
              >
                <q-tooltip>{{ $t('housekeeping.editTodo') }}</q-tooltip>
              </q-btn>
              <q-btn
                v-if="canDelete(item)"
                flat
                dense
                round
                color="negative"
                icon="delete"
                :aria-label="$t('housekeeping.deleteTodo')"
                @click="removeTodo(item)"
              >
                <q-tooltip>{{ $t('housekeeping.deleteTodo') }}</q-tooltip>
              </q-btn>
            </div>
          </q-item-section>
        </q-item>
      </q-list>
    </q-card>

    <q-dialog v-model="editorOpen" :maximized="$q.screen.lt.sm" @hide="closeEditor">
      <q-card flat bordered class="panel-card housekeeping-dialog-card">
        <q-card-section class="users-admin-dialog-header">
          <div class="panel-title">{{ editingId ? $t('housekeeping.editTodo') : $t('housekeeping.newTodo') }}</div>
          <q-btn flat dense round icon="close" :aria-label="$t('housekeeping.closeEditor')" @click="closeEditor">
            <q-tooltip>{{ $t('housekeeping.closeEditor') }}</q-tooltip>
          </q-btn>
        </q-card-section>
        <q-card-section class="q-gutter-md">
          <q-input v-model="form.name" outlined :label="$t('housekeeping.name')" />
          <q-input
            v-model="form.description"
            outlined
            autogrow
            type="textarea"
            :label="$t('housekeeping.description')"
          />
          <div class="row q-gutter-sm users-admin-dialog-actions">
            <q-btn unelevated color="primary" :label="$t('housekeeping.save')" :loading="saving" @click="save" />
            <q-btn flat color="primary" :label="$t('housekeeping.cancel')" @click="closeEditor" />
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog v-model="statusOpen" :maximized="$q.screen.lt.sm" @hide="closeStatusDialog">
      <q-card flat bordered class="panel-card housekeeping-dialog-card">
        <q-card-section class="users-admin-dialog-header">
          <div class="panel-title">{{ $t('housekeeping.editNotes') }}</div>
          <q-btn flat dense round icon="close" :aria-label="$t('housekeeping.closeEditor')" @click="closeStatusDialog">
            <q-tooltip>{{ $t('housekeeping.closeEditor') }}</q-tooltip>
          </q-btn>
        </q-card-section>
        <q-card-section class="q-gutter-md">
          <q-toggle v-model="statusForm.is_done" :label="$t('housekeeping.done')" />
          <q-input
            v-model="statusForm.housekeeper_notes"
            outlined
            autogrow
            type="textarea"
            :label="$t('housekeeping.housekeeperNotes')"
          />
          <div class="row q-gutter-sm users-admin-dialog-actions">
            <q-btn
              unelevated
              color="primary"
              :label="$t('housekeeping.save')"
              :loading="statusSaving"
              @click="saveStatus"
            />
            <q-btn flat color="primary" :label="$t('housekeeping.cancel')" @click="closeStatusDialog" />
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { defineComponent } from 'vue'
import { Dialog, Notify } from 'quasar'
import { api } from 'boot/axios'
import { useAuthStore } from 'stores/auth-store'

function defaultForm() {
  return {
    id: null,
    name: '',
    description: '',
  }
}

function defaultStatusForm() {
  return {
    id: null,
    is_done: false,
    housekeeper_notes: '',
  }
}

export default defineComponent({
  name: 'HousekeepingPage',
  data() {
    return {
      auth: useAuthStore(),
      items: [],
      loading: false,
      loadError: false,
      saving: false,
      editorOpen: false,
      editingId: null,
      form: defaultForm(),
      statusOpen: false,
      statusSaving: false,
      statusSavingId: null,
      statusForm: defaultStatusForm(),
    }
  },
  async mounted() {
    await this.loadItems()
  },
  methods: {
    async loadItems() {
      this.loading = true
      this.loadError = false

      try {
        const { data } = await api.get('housekeeping/list')
        this.items = data.items || []
      } catch {
        this.loadError = true
      } finally {
        this.loading = false
      }
    },
    formatDate(value) {
      if (!value) {
        return this.$t('housekeeping.notSet')
      }

      const normalizedValue = typeof value === 'string' ? value.replace(' ', 'T') : value

      return new Intl.DateTimeFormat(this.$i18n.locale, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(normalizedValue))
    },
    canEdit(item) {
      return Number(item.created_by) === Number(this.auth.user?.id)
    },
    canDelete(item) {
      return this.canEdit(item) || this.auth.isAdmin
    },
    openCreateDialog() {
      this.editingId = null
      this.form = defaultForm()
      this.editorOpen = true
    },
    startEdit(item) {
      this.editingId = item.id
      this.form = {
        id: item.id,
        name: item.name || '',
        description: item.description || '',
      }
      this.editorOpen = true
    },
    closeEditor() {
      this.editorOpen = false
      this.editingId = null
      this.form = defaultForm()
    },
    async save() {
      this.saving = true
      const isEditing = Boolean(this.editingId)

      try {
        await api.post(isEditing ? 'housekeeping/update' : 'housekeeping/create', { ...this.form })
        await this.loadItems()
        this.closeEditor()
        Notify.create({
          type: 'positive',
          message: this.$t(isEditing ? 'housekeeping.updateSuccess' : 'housekeeping.createSuccess'),
        })
      } catch {
        Notify.create({
          type: 'negative',
          message: this.$t(isEditing ? 'housekeeping.updateFailed' : 'housekeeping.createFailed'),
        })
      } finally {
        this.saving = false
      }
    },
    removeTodo(item) {
      Dialog.create({
        title: this.$t('housekeeping.deleteTodo'),
        message: this.$t('housekeeping.deleteConfirm', { name: item.name }),
        cancel: true,
        persistent: true,
      }).onOk(async () => {
        try {
          await api.post('housekeeping/delete', { id: item.id })
          await this.loadItems()
          Notify.create({ type: 'positive', message: this.$t('housekeeping.deleteSuccess') })
        } catch {
          Notify.create({ type: 'negative', message: this.$t('housekeeping.deleteFailed') })
        }
      })
    },
    async toggleDone(item, value) {
      this.statusSavingId = item.id
      try {
        await api.post('housekeeping/update_status', {
          id: item.id,
          is_done: Boolean(value),
          housekeeper_notes: item.housekeeper_notes || '',
        })
        await this.loadItems()
      } catch {
        Notify.create({ type: 'negative', message: this.$t('housekeeping.statusUpdateFailed') })
      } finally {
        this.statusSavingId = null
      }
    },
    openStatusDialog(item) {
      this.statusForm = {
        id: item.id,
        is_done: Boolean(item.is_done),
        housekeeper_notes: item.housekeeper_notes || '',
      }
      this.statusOpen = true
    },
    closeStatusDialog() {
      this.statusOpen = false
      this.statusForm = defaultStatusForm()
    },
    async saveStatus() {
      this.statusSaving = true
      this.statusSavingId = this.statusForm.id

      try {
        await api.post('housekeeping/update_status', { ...this.statusForm })
        await this.loadItems()
        this.closeStatusDialog()
        Notify.create({ type: 'positive', message: this.$t('housekeeping.statusUpdateSuccess') })
      } catch {
        Notify.create({ type: 'negative', message: this.$t('housekeeping.statusUpdateFailed') })
      } finally {
        this.statusSaving = false
        this.statusSavingId = null
      }
    },
  },
})
</script>
