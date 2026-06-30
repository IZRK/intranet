<template>
  <q-page class="page-wrap equipment-orders-page">
    <section class="content-header users-admin-header">
      <div class="users-admin-header-row">
        <div>
          <h1 class="page-title">{{ $t('equipmentOrders.title') }}</h1>
          <p class="page-lead">{{ $t('equipmentOrders.lead') }}</p>
        </div>
        <q-btn
          v-if="auth.isIzrk"
          flat
          dense
          round
          color="primary"
          icon="add_shopping_cart"
          :aria-label="$t('equipmentOrders.newOrder')"
          @click="openCreateDialog"
        >
          <q-tooltip>{{ $t('equipmentOrders.newOrder') }}</q-tooltip>
        </q-btn>
      </div>
    </section>

    <q-card flat bordered class="panel-card equipment-orders-card">
      <q-card-section v-if="loadError">
        <q-banner rounded class="status-banner status-banner-danger">
          {{ $t('equipmentOrders.loadFailed') }}
        </q-banner>
      </q-card-section>

      <q-inner-loading :showing="loading" />

      <q-card-section v-if="!loading && !loadError && !items.length">
        <q-banner rounded class="banner-info">
          {{ $t('equipmentOrders.noOrders') }}
        </q-banner>
      </q-card-section>

      <q-card-section v-else-if="!loadError" class="equipment-orders-toolbar">
        <q-input
          v-model="searchQuery"
          outlined
          dense
          clearable
          debounce="150"
          class="equipment-orders-search"
          :label="$t('equipmentOrders.search')"
        >
          <template #prepend>
            <q-icon name="search" />
          </template>
        </q-input>
      </q-card-section>

      <q-card-section v-if="!loading && !loadError && items.length && !filteredItems.length">
        <q-banner rounded class="banner-info">
          {{ $t('equipmentOrders.noSearchResults') }}
        </q-banner>
      </q-card-section>

      <q-table
        v-if="!loadError && filteredItems.length"
        flat
        class="equipment-orders-table"
        row-key="id"
        :rows="filteredItems"
        :columns="columns"
        :pagination="{ rowsPerPage: 0 }"
        :loading="loading"
        :sort-method="groupedSort"
        :table-row-class-fn="orderRowClass"
        hide-bottom
        wrap-cells
      >
        <template #body-cell-gear_name="props">
          <q-td :props="props">
            <div class="equipment-orders-gear">{{ props.row.gear_name }}</div>
          </q-td>
        </template>

        <template #body-cell-requester_name="props">
          <q-td :props="props">
            <div>{{ props.row.requester_name || $t('equipmentOrders.unknownUser') }}</div>
            <div v-if="props.row.creator_name && props.row.creator_name !== props.row.requester_name" class="equipment-orders-secondary">
              {{ $t('equipmentOrders.enteredBy', { name: props.row.creator_name }) }}
            </div>
          </q-td>
        </template>

        <template #body-cell-created_at="props">
          <q-td :props="props">{{ formatDate(props.row.created_at) }}</q-td>
        </template>

        <template #body-cell-updated_at="props">
          <q-td :props="props">{{ formatDate(props.row.updated_at) }}</q-td>
        </template>

        <template #body-cell-notes="props">
          <q-td :props="props">
            <div v-if="props.row.notes" class="equipment-orders-notes">
              <q-icon name="sticky_note_2" size="18px" />
              <div class="equipment-orders-notes-body">
                <div class="equipment-orders-notes-text">{{ props.row.notes }}</div>
                <div v-if="props.row.notes_author_name || props.row.notes_at" class="equipment-orders-note-signature">
                  <div v-if="props.row.notes_author_name" class="equipment-orders-note-author">
                    ~ {{ props.row.notes_author_name }}
                  </div>
                  <div v-if="props.row.notes_at" class="equipment-orders-note-timestamp">
                    {{ formatNoteTimestamp(props.row.notes_at) }}
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="equipment-orders-secondary">{{ $t('equipmentOrders.noNotes') }}</div>
            <q-btn
              v-if="auth.isHousekeeper"
              class="equipment-orders-note-btn"
              flat
              dense
              no-caps
              color="primary"
              icon="edit_note"
              :label="$t('equipmentOrders.editNotes')"
              @click="openStateDialog(props.row)"
            />
          </q-td>
        </template>

        <template v-for="state in stateKeys" #[`body-cell-${state}`]="props" :key="state">
          <q-td :props="props" class="equipment-orders-state-cell">
            <q-radio
              dense
              :disable="!auth.isHousekeeper || stateSavingId === props.row.id"
              :model-value="props.row.state"
              :val="state"
              :aria-label="$t(`equipmentOrders.states.${state}`)"
              @update:model-value="updateState(props.row, state)"
            />
          </q-td>
        </template>

        <template #body-cell-actions="props">
          <q-td :props="props">
            <q-btn
              v-if="canEdit(props.row)"
              flat
              dense
              round
              color="primary"
              icon="edit"
              :aria-label="$t('equipmentOrders.editOrder')"
              @click="openEditDialog(props.row)"
            >
              <q-tooltip>{{ $t('equipmentOrders.editOrder') }}</q-tooltip>
            </q-btn>
            <q-btn
              v-if="canDelete(props.row)"
              flat
              dense
              round
              color="negative"
              icon="delete"
              :aria-label="$t('equipmentOrders.deleteOrder')"
              @click="removeOrder(props.row)"
            >
              <q-tooltip>{{ $t('equipmentOrders.deleteOrder') }}</q-tooltip>
            </q-btn>
          </q-td>
        </template>
      </q-table>
    </q-card>

    <q-dialog v-model="editorOpen" :maximized="$q.screen.lt.sm" @hide="closeEditor">
      <q-card flat bordered class="panel-card equipment-orders-dialog-card">
        <q-card-section class="users-admin-dialog-header">
          <div class="panel-title">{{ editorTitle }}</div>
          <q-btn flat dense round icon="close" :aria-label="$t('equipmentOrders.closeEditor')" @click="closeEditor">
            <q-tooltip>{{ $t('equipmentOrders.closeEditor') }}</q-tooltip>
          </q-btn>
        </q-card-section>
        <q-card-section class="q-gutter-md">
          <q-input v-model="form.gear_name" outlined :label="$t('equipmentOrders.gearName')" />
          <q-select
            v-model="form.requested_by"
            outlined
            emit-value
            map-options
            use-input
            fill-input
            hide-selected
            input-debounce="0"
            option-value="id"
            option-label="label"
            :options="filteredUsers"
            :label="$t('equipmentOrders.requestedBy')"
            @filter="filterUsers"
            @popup-show="resetUserOptions"
          >
            <template #option="scope">
              <q-item v-bind="scope.itemProps">
                <q-item-section>
                  <q-item-label>{{ scope.opt.label }}</q-item-label>
                  <q-item-label v-if="scope.opt.email" caption>{{ scope.opt.email }}</q-item-label>
                </q-item-section>
              </q-item>
            </template>
          </q-select>
          <q-input
            v-model="form.notes"
            outlined
            autogrow
            type="textarea"
            :label="$t('equipmentOrders.notes')"
          />
          <div class="row q-gutter-sm users-admin-dialog-actions">
            <q-btn unelevated color="primary" :label="$t('equipmentOrders.save')" :loading="saving" @click="save" />
            <q-btn flat color="primary" :label="$t('equipmentOrders.cancel')" @click="closeEditor" />
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog v-model="stateDialogOpen" :maximized="$q.screen.lt.sm" @hide="closeStateDialog">
      <q-card flat bordered class="panel-card equipment-orders-dialog-card">
        <q-card-section class="users-admin-dialog-header">
          <div class="panel-title">{{ $t('equipmentOrders.editState') }}</div>
          <q-btn flat dense round icon="close" :aria-label="$t('equipmentOrders.closeEditor')" @click="closeStateDialog">
            <q-tooltip>{{ $t('equipmentOrders.closeEditor') }}</q-tooltip>
          </q-btn>
        </q-card-section>
        <q-card-section class="q-gutter-md">
          <q-option-group
            v-model="stateForm.state"
            type="radio"
            :options="stateOptions"
          />
          <q-input
            v-model="stateForm.notes"
            outlined
            autogrow
            type="textarea"
            :label="$t('equipmentOrders.notes')"
          />
          <div class="row q-gutter-sm users-admin-dialog-actions">
            <q-btn unelevated color="primary" :label="$t('equipmentOrders.save')" :loading="stateSaving" @click="saveStateDialog" />
            <q-btn flat color="primary" :label="$t('equipmentOrders.cancel')" @click="closeStateDialog" />
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

const STATE_KEYS = ['pending', 'ready_for_pickup', 'ordered', 'arrived']
const STATE_SORT_ORDER = STATE_KEYS.reduce((orders, state, index) => {
  orders[state] = index
  return orders
}, {})

function defaultForm() {
  return {
    id: null,
    gear_name: '',
    requested_by: null,
    notes: '',
  }
}

function defaultStateForm() {
  return {
    id: null,
    state: 'pending',
    notes: '',
  }
}

function normalizeUser(user) {
  const id = Number(user.id)
  const name = String(user.name || '').trim()
  const email = String(user.email || '').trim()
  const label = name || email || `#${id}`

  return {
    ...user,
    id,
    email,
    label,
    search_text: `${name} ${email}`.trim().toLowerCase(),
  }
}

function normalizeOrder(item) {
  return {
    ...item,
    id: Number(item.id),
    requested_by: Number(item.requested_by),
    created_by: Number(item.created_by),
    state_updated_by: item.state_updated_by == null ? null : Number(item.state_updated_by),
  }
}

function dateValue(value) {
  if (!value) {
    return 0
  }

  const date = new Date(typeof value === 'string' ? value.replace(' ', 'T') : value)
  const timestamp = date.getTime()

  return Number.isNaN(timestamp) ? 0 : timestamp
}

function stateRank(item) {
  return STATE_SORT_ORDER[item.state] ?? STATE_KEYS.length
}

function stringValue(value) {
  return String(value || '').toLocaleLowerCase()
}

export default defineComponent({
  name: 'NarocilaPage',
  data() {
    return {
      auth: useAuthStore(),
      items: [],
      users: [],
      filteredUsers: [],
      loading: false,
      loadError: false,
      saving: false,
      editorOpen: false,
      form: defaultForm(),
      searchQuery: '',
      stateDialogOpen: false,
      stateSaving: false,
      stateSavingId: null,
      stateForm: defaultStateForm(),
      stateKeys: STATE_KEYS,
    }
  },
  computed: {
    columns() {
      return [
        { name: 'gear_name', label: this.$t('equipmentOrders.gearName'), field: 'gear_name', align: 'left', sortable: true },
        { name: 'requester_name', label: this.$t('equipmentOrders.requestedBy'), field: 'requester_name', align: 'left', sortable: true },
        { name: 'created_at', label: this.$t('equipmentOrders.date'), field: 'created_at', align: 'left', sortable: true },
        { name: 'updated_at', label: this.$t('equipmentOrders.updatedAt'), field: 'updated_at', align: 'left', sortable: true },
        { name: 'notes', label: this.$t('equipmentOrders.notes'), field: 'notes', align: 'left', classes: 'equipment-orders-notes-cell' },
        ...STATE_KEYS.map((state) => ({
          name: state,
          label: this.$t(`equipmentOrders.states.${state}`),
          field: 'state',
          align: 'center',
        })),
        { name: 'actions', label: '', field: 'actions', align: 'right' },
      ]
    },
    stateOptions() {
      return STATE_KEYS.map((state) => ({
        label: this.$t(`equipmentOrders.states.${state}`),
        value: state,
      }))
    },
    editorTitle() {
      return this.form.id ? this.$t('equipmentOrders.editOrder') : this.$t('equipmentOrders.newOrder')
    },
    filteredItems() {
      const needle = String(this.searchQuery || '').trim().toLowerCase()
      if (!needle) {
        return this.groupedSort(this.items)
      }

      const filtered = this.items.filter((item) => {
        const haystack = [
          item.gear_name,
          item.requester_name,
          item.creator_name,
          item.notes,
          item.notes_author_name,
          item.state_updated_by_name,
          item.requester_email,
          item.creator_email,
          this.$t(`equipmentOrders.states.${item.state}`),
        ].filter(Boolean).join(' ').toLowerCase()

        return haystack.includes(needle)
      })

      return this.groupedSort(filtered)
    },
  },
  async mounted() {
    await Promise.all([this.loadItems(), this.loadUsers()])
  },
  methods: {
    async loadItems() {
      this.loading = true
      this.loadError = false

      try {
        const { data } = await api.get('equipment_orders/list')
        this.items = (data.items || []).map(normalizeOrder)
      } catch {
        this.loadError = true
      } finally {
        this.loading = false
      }
    },
    async loadUsers() {
      const { data } = await api.get('equipment_orders/users')
      this.users = (data.users || []).map(normalizeUser)
      this.filteredUsers = this.users
    },
    formatDate(value) {
      if (!value) {
        return this.$t('equipmentOrders.notSet')
      }

      const normalizedValue = typeof value === 'string' ? value.replace(' ', 'T') : value
      return new Intl.DateTimeFormat(this.$i18n.locale, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(normalizedValue))
    },
    formatNoteTimestamp(value) {
      if (!value) {
        return ''
      }

      const date = new Date(typeof value === 'string' ? value.replace(' ', 'T') : value)
      const pad = (part) => String(part).padStart(2, '0')

      return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`
    },
    filterUsers(value, update) {
      const needle = String(value || '').trim().toLowerCase()
      update(() => {
        this.filteredUsers = needle
          ? this.users.filter((user) => user.search_text.includes(needle))
          : this.users
      })
    },
    resetUserOptions() {
      this.filteredUsers = this.users
    },
    orderRowClass(row) {
      return row.state === 'arrived' ? 'equipment-orders-row-arrived' : ''
    },
    groupedSort(rows, sortBy = 'updated_at', descending = true) {
      const sortKey = sortBy || 'updated_at'
      const direction = descending ? -1 : 1
      const dateFields = new Set(['created_at', 'updated_at'])

      return [...rows].sort((left, right) => {
        const stateDiff = stateRank(left) - stateRank(right)
        if (stateDiff !== 0) {
          return stateDiff
        }

        let valueDiff = 0
        if (dateFields.has(sortKey)) {
          valueDiff = dateValue(left[sortKey]) - dateValue(right[sortKey])
        } else {
          valueDiff = stringValue(left[sortKey]).localeCompare(stringValue(right[sortKey]))
        }

        if (valueDiff !== 0) {
          return valueDiff * direction
        }

        const updatedDiff = dateValue(right.updated_at) - dateValue(left.updated_at)
        if (updatedDiff !== 0) {
          return updatedDiff
        }

        return Number(right.id || 0) - Number(left.id || 0)
      })
    },
    openCreateDialog() {
      this.form = defaultForm()
      this.form.requested_by = this.auth.user?.id ? Number(this.auth.user.id) : null
      this.filteredUsers = this.users
      this.editorOpen = true
    },
    openEditDialog(item) {
      this.form = {
        id: item.id,
        gear_name: item.gear_name || '',
        requested_by: item.requested_by ? Number(item.requested_by) : null,
        notes: item.notes || '',
      }
      this.filteredUsers = this.users
      this.editorOpen = true
    },
    closeEditor() {
      this.editorOpen = false
      this.form = defaultForm()
    },
    async save() {
      this.saving = true
      const isEdit = Boolean(this.form.id)

      try {
        const endpoint = isEdit ? 'equipment_orders/update' : 'equipment_orders/create'
        await api.post(endpoint, { ...this.form })
        await this.loadItems()
        this.closeEditor()
        Notify.create({
          type: 'positive',
          message: this.$t(isEdit ? 'equipmentOrders.updateSuccess' : 'equipmentOrders.createSuccess'),
        })
      } catch {
        Notify.create({
          type: 'negative',
          message: this.$t(isEdit ? 'equipmentOrders.updateFailed' : 'equipmentOrders.createFailed'),
        })
      } finally {
        this.saving = false
      }
    },
    canEdit(item) {
      return Number(item.created_by) === Number(this.auth.user?.id) || this.auth.isAdmin
    },
    canDelete(item) {
      return Number(item.created_by) === Number(this.auth.user?.id) || this.auth.isAdmin
    },
    async updateState(item, state) {
      if (!this.auth.isHousekeeper || item.state === state) {
        return
      }

      this.stateSavingId = item.id
      try {
        await api.post('equipment_orders/update_state', {
          id: item.id,
          state,
          notes: item.notes || '',
        })
        await this.loadItems()
      } catch {
        Notify.create({ type: 'negative', message: this.$t('equipmentOrders.stateUpdateFailed') })
      } finally {
        this.stateSavingId = null
      }
    },
    openStateDialog(item) {
      this.stateForm = {
        id: item.id,
        state: item.state || 'pending',
        notes: item.notes || '',
      }
      this.stateDialogOpen = true
    },
    closeStateDialog() {
      this.stateDialogOpen = false
      this.stateForm = defaultStateForm()
    },
    async saveStateDialog() {
      this.stateSaving = true
      this.stateSavingId = this.stateForm.id

      try {
        await api.post('equipment_orders/update_state', { ...this.stateForm })
        await this.loadItems()
        this.closeStateDialog()
        Notify.create({ type: 'positive', message: this.$t('equipmentOrders.stateUpdateSuccess') })
      } catch {
        Notify.create({ type: 'negative', message: this.$t('equipmentOrders.stateUpdateFailed') })
      } finally {
        this.stateSaving = false
        this.stateSavingId = null
      }
    },
    removeOrder(item) {
      Dialog.create({
        title: this.$t('equipmentOrders.deleteOrder'),
        message: this.$t('equipmentOrders.deleteConfirm', { name: item.gear_name }),
        cancel: true,
        persistent: true,
      }).onOk(async () => {
        try {
          await api.post('equipment_orders/delete', { id: item.id })
          await this.loadItems()
          Notify.create({ type: 'positive', message: this.$t('equipmentOrders.deleteSuccess') })
        } catch {
          Notify.create({ type: 'negative', message: this.$t('equipmentOrders.deleteFailed') })
        }
      })
    },
  },
})
</script>

<style scoped lang="scss">
.equipment-orders-card {
  position: relative;
}

.equipment-orders-toolbar {
  padding-bottom: 0;
}

.equipment-orders-search {
  max-width: 360px;
}

.equipment-orders-table {
  width: 100%;
}

.equipment-orders-gear {
  color: var(--app-text);
  font-weight: 700;
  overflow-wrap: anywhere;
}

.equipment-orders-secondary {
  margin-top: 3px;
  color: var(--app-muted);
  font-size: 0.82rem;
}

.equipment-orders-notes {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  width: fit-content;
  max-width: 360px;
  padding: 10px 12px;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  background: color-mix(in srgb, var(--app-primary) 7%, var(--app-surface));
  color: var(--app-text);
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.equipment-orders-notes-body {
  min-width: 0;
}

.equipment-orders-notes-text {
  white-space: pre-line;
}

.equipment-orders-note-signature {
  margin-top: 8px;
}

.equipment-orders-note-author {
  font-style: italic;
}

.equipment-orders-note-timestamp {
  margin-top: 1px;
  color: var(--app-muted);
  font-size: 0.68rem;
  line-height: 1.2;
}

.equipment-orders-note-btn {
  margin-top: 4px;
  padding-left: 0;
}

.equipment-orders-state-cell {
  width: 92px;
}

.equipment-orders-dialog-card {
  width: min(620px, calc(100vw - 32px));
}

:deep(.equipment-orders-row-arrived) {
  background: color-mix(in srgb, var(--app-muted) 10%, transparent);
  opacity: 0.72;
}

:deep(.equipment-orders-row-arrived .equipment-orders-gear),
:deep(.equipment-orders-row-arrived td:not(.equipment-orders-state-cell):not(.equipment-orders-notes-cell)) {
  color: var(--app-muted);
  text-decoration: line-through;
}

:deep(.equipment-orders-row-arrived .q-radio__inner),
:deep(.equipment-orders-row-arrived .q-btn),
:deep(.equipment-orders-row-arrived .equipment-orders-notes),
:deep(.equipment-orders-row-arrived .equipment-orders-notes *),
:deep(.equipment-orders-row-arrived .equipment-orders-note-signature),
:deep(.equipment-orders-row-arrived .equipment-orders-note-timestamp) {
  text-decoration: none;
}
</style>
