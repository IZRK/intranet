<template>
  <q-page class="page-wrap">
    <section class="content-header users-admin-header">
      <div class="users-admin-header-row">
        <div>
          <h1 class="page-title">{{ $t('usersAdmin.title') }}</h1>
        </div>
        <q-btn
          flat
          dense
          round
          color="primary"
          icon="person_add"
          :aria-label="$t('usersAdmin.newUser')"
          @click="openCreateDialog"
        >
          <q-tooltip>{{ $t('usersAdmin.newUser') }}</q-tooltip>
        </q-btn>
      </div>
    </section>

    <q-card flat bordered class="panel-card">
      <q-card-section class="users-admin-toolbar">
        <q-input
          v-model="searchQuery"
          dense
          outlined
          clearable
          hide-bottom-space
          class="users-admin-search"
          :placeholder="$t('usersAdmin.searchUsers')"
        >
          <template #prepend>
            <q-icon name="search" />
          </template>
        </q-input>
      </q-card-section>

      <q-card-section v-if="loadError">
        <q-banner rounded class="status-banner status-banner-danger">
          {{ $t('usersAdmin.loadFailed') }}
        </q-banner>
      </q-card-section>

      <q-table
        v-else
        v-model:pagination="tablePagination"
        flat
        dense
        row-key="id"
        class="users-admin-table"
        :rows="filteredUsers"
        :columns="tableColumns"
        :loading="loading"
        :rows-per-page-options="[10, 20, 50, 0]"
        :grid="$q.screen.lt.md"
        table-style="min-width: 720px"
      >
        <template #body-cell-name="props">
          <q-td :props="props">
            <div class="users-admin-name-cell">
              <div class="users-admin-name-primary">{{ displayName(props.row) }}</div>
              <div class="users-admin-name-secondary">{{ props.row.email }}</div>
            </div>
          </q-td>
        </template>
        <template #body-cell-role="props">
          <q-td :props="props">
            {{ roleLabel(props.row.role) }}
          </q-td>
        </template>
        <template #body-cell-lastlogin="props">
          <q-td :props="props">
            {{ formatDate(props.row.lastlogin) }}
          </q-td>
        </template>
        <template #body-cell-actions="props">
          <q-td :props="props" class="user-item-actions-cell">
            <div class="user-item-actions">
              <q-btn flat dense round icon="edit" :aria-label="$t('usersAdmin.editUser')" @click="startEdit(props.row)">
                <q-tooltip>{{ $t('usersAdmin.editUser') }}</q-tooltip>
              </q-btn>
              <q-btn flat dense round color="negative" icon="delete" :aria-label="$t('usersAdmin.deleteUser')" @click="removeUser(props.row)">
                <q-tooltip>{{ $t('usersAdmin.deleteUser') }}</q-tooltip>
              </q-btn>
            </div>
          </q-td>
        </template>
        <template #item="props">
          <div class="q-pa-xs col-12">
            <q-card flat bordered class="users-admin-mobile-card">
              <q-card-section class="users-admin-mobile-card-header">
                <div>
                  <div class="users-admin-name-primary">{{ displayName(props.row) }}</div>
                  <div class="users-admin-name-secondary">{{ props.row.email }}</div>
                </div>
                <div class="user-item-actions">
                  <q-btn flat dense round icon="edit" :aria-label="$t('usersAdmin.editUser')" @click="startEdit(props.row)">
                    <q-tooltip>{{ $t('usersAdmin.editUser') }}</q-tooltip>
                  </q-btn>
                  <q-btn flat dense round color="negative" icon="delete" :aria-label="$t('usersAdmin.deleteUser')" @click="removeUser(props.row)">
                    <q-tooltip>{{ $t('usersAdmin.deleteUser') }}</q-tooltip>
                  </q-btn>
                </div>
              </q-card-section>
              <q-card-section class="users-admin-mobile-meta">
                <div><strong>{{ $t('usersAdmin.phone') }}:</strong> {{ props.row.phone_number || '-' }}</div>
                <div><strong>{{ $t('usersAdmin.mobile') }}:</strong> {{ props.row.mobile_number || '-' }}</div>
                <div><strong>{{ $t('usersAdmin.roles') }}:</strong> {{ roleLabel(props.row.role) }}</div>
                <div><strong>{{ $t('usersAdmin.lastLogin') }}:</strong> {{ formatDate(props.row.lastlogin) }}</div>
              </q-card-section>
            </q-card>
          </div>
        </template>
        <template #no-data>
          <div class="full-width q-pa-md">
            <q-banner rounded class="banner-info">
              {{ searchQuery.trim() ? $t('usersAdmin.noSearchResults') : $t('usersAdmin.noUsers') }}
            </q-banner>
          </div>
        </template>
      </q-table>
    </q-card>

    <q-dialog v-model="editorOpen" :maximized="$q.screen.lt.sm" @hide="closeEditor">
      <q-card flat bordered class="panel-card users-admin-dialog-card">
        <q-card-section class="users-admin-dialog-header">
          <div class="panel-title">{{ editingId ? $t('usersAdmin.editUser') : $t('usersAdmin.newUser') }}</div>
          <q-btn
            flat
            dense
            round
            icon="close"
            :aria-label="$t('usersAdmin.closeEditor')"
            @click="closeEditor"
          >
            <q-tooltip>{{ $t('usersAdmin.closeEditor') }}</q-tooltip>
          </q-btn>
        </q-card-section>
        <q-card-section class="q-gutter-md">
          <q-input v-model="form.first_name" outlined :label="$t('usersAdmin.firstName')" />
          <q-input v-model="form.last_name" outlined :label="$t('usersAdmin.lastName')" />
          <q-input v-model="form.email" outlined type="email" :label="$t('usersAdmin.email')" />
          <q-input v-model="form.phone_number" outlined :label="$t('usersAdmin.phone')" />
          <q-input v-model="form.mobile_number" outlined :label="$t('usersAdmin.mobile')" />
          <div class="users-admin-check-group">
            <div class="users-admin-field-label">{{ $t('usersAdmin.roles') }}</div>
            <q-option-group
              v-model="form.role"
              type="checkbox"
              :options="roleOptions"
              class="users-admin-role-options"
            />
          </div>
          <q-input
            v-model="form.password"
            outlined
            type="password"
            autocomplete="new-password"
            :label="$t('usersAdmin.password')"
            :hint="editingId ? $t('usersAdmin.passwordHintUpdate') : $t('usersAdmin.passwordHintCreate')"
          />
          <div class="row q-gutter-sm users-admin-dialog-actions">
            <q-btn
              unelevated
              color="primary"
              :label="$t('usersAdmin.save')"
              :loading="saving"
              @click="save"
            />
            <q-btn flat color="primary" :label="$t('messaging.cancel')" @click="closeEditor" />
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { defineComponent } from 'vue'
import { Notify, Dialog } from 'quasar'
import { api } from 'boot/axios'
import { useAuthStore } from 'stores/auth-store'

function defaultForm() {
  return {
    id: null,
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    mobile_number: '',
    role: [],
    password: '',
  }
}

function formFromUser(user) {
  return {
    id: user.id,
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    email: user.email || '',
    phone_number: user.phone_number || '',
    mobile_number: user.mobile_number || '',
    role: Array.isArray(user.role) ? [...user.role] : [],
    password: '',
  }
}

export default defineComponent({
  name: 'UsersAdminPage',
  data() {
    return {
      auth: useAuthStore(),
      users: [],
      searchQuery: '',
      tablePagination: {
        sortBy: 'name',
        descending: false,
        rowsPerPage: 50,
      },
      loading: false,
      saving: false,
      loadError: false,
      editorOpen: false,
      editingId: null,
      form: defaultForm(),
    }
  },
  computed: {
    tableColumns() {
      return [
        {
          name: 'name',
          label: this.$t('usersAdmin.fullName'),
          align: 'left',
          field: (row) => this.displayName(row),
          sortable: true,
        },
        {
          name: 'email',
          label: this.$t('usersAdmin.email'),
          align: 'left',
          field: 'email',
          sortable: true,
        },
        {
          name: 'phone_number',
          label: this.$t('usersAdmin.phone'),
          align: 'left',
          field: (row) => row.phone_number || '',
          sortable: true,
        },
        {
          name: 'mobile_number',
          label: this.$t('usersAdmin.mobile'),
          align: 'left',
          field: (row) => row.mobile_number || '',
          sortable: true,
        },
        {
          name: 'role',
          label: this.$t('usersAdmin.roles'),
          align: 'left',
          field: (row) => this.roleLabel(row.role),
          sortable: true,
        },
        {
          name: 'lastlogin',
          label: this.$t('usersAdmin.lastLogin'),
          align: 'left',
          field: (row) => row.lastlogin || '',
          sortable: true,
        },
        {
          name: 'actions',
          label: this.$t('usersAdmin.actions'),
          align: 'right',
          field: 'id',
        },
      ]
    },
    filteredUsers() {
      const query = this.searchQuery.trim().toLowerCase()
      if (!query) {
        return this.users
      }

      return this.users.filter((user) => {
        const haystack = [
          this.displayName(user),
          user.first_name,
          user.last_name,
          user.email,
          ...(Array.isArray(user.role) ? user.role : []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        return haystack.includes(query)
      })
    },
    roleOptions() {
      return [
        { label: this.$t('usersAdmin.roleIzrk'), value: 'izrk' },
        { label: this.$t('usersAdmin.roleAdmin'), value: 'admin' },
      ]
    },
  },
  async mounted() {
    await this.loadUsers()
  },
  methods: {
    displayName(user) {
      const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ').trim()
      return fullName || user.name || user.email
    },
    formatDate(value) {
      if (!value) {
        return this.$t('usersAdmin.never')
      }

      return new Date(value).toLocaleString()
    },
    roleLabel(roles) {
      return (roles || [])
        .map((role) => (role === 'admin' ? this.$t('usersAdmin.roleAdmin') : role === 'izrk' ? this.$t('usersAdmin.roleIzrk') : role))
        .join(', ')
    },
    async loadUsers() {
      this.loading = true
      this.loadError = false

      try {
        const { data } = await api.get('users')
        this.users = data.users || []
      } catch {
        this.loadError = true
      } finally {
        this.loading = false
      }
    },
    openCreateDialog() {
      this.editingId = null
      this.form = defaultForm()
      this.editorOpen = true
    },
    startEdit(user) {
      this.editingId = user.id
      this.form = formFromUser(user)
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
        const payload = { ...this.form }
        payload.role = Array.isArray(payload.role) ? payload.role : []
        const route = isEditing ? 'users/update' : 'users/create'
        const { data } = await api.post(route, payload)
        if (data.token || (data.user && data.user.id === this.auth.user?.id)) {
          this.auth.applySession(data)
        }

        await this.loadUsers()
        this.closeEditor()
        Notify.create({
          type: 'positive',
          message: this.$t(isEditing ? 'usersAdmin.updateSuccess' : 'usersAdmin.createSuccess'),
        })
      } catch {
        Notify.create({
          type: 'negative',
          message: this.$t(isEditing ? 'usersAdmin.updateFailed' : 'usersAdmin.createFailed'),
        })
      } finally {
        this.saving = false
      }
    },
    removeUser(user) {
      Dialog.create({
        title: this.$t('usersAdmin.deleteUser'),
        message: this.$t('usersAdmin.deleteConfirm', { name: user.name || user.email }),
        cancel: true,
        persistent: true,
      }).onOk(async () => {
        try {
          await api.post('users/delete', { id: user.id })
          if (this.editingId === user.id) {
            this.closeEditor()
          }
          await this.loadUsers()
          Notify.create({ type: 'positive', message: this.$t('usersAdmin.deleteSuccess') })
        } catch {
          Notify.create({ type: 'negative', message: this.$t('usersAdmin.deleteFailed') })
        }
      })
    },
  },
})
</script>
