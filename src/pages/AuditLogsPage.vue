<template>
  <q-page class="page-wrap">
    <section class="content-header">
      <div>
        <h1 class="page-title">{{ $t('auditLogs.title') }}</h1>
        <p class="page-lead">{{ $t('auditLogs.lead') }}</p>
      </div>
    </section>

    <q-card flat bordered class="panel-card">
      <q-card-section class="audit-toolbar">
        <q-tabs
          v-model="activeTab"
          inline-label
          no-caps
          class="audit-tabs"
          @update:model-value="handleTabChange"
        >
          <q-tab name="audit" icon="admin_panel_settings" :label="$t('auditLogs.auditTab')" />
          <q-tab name="views" icon="visibility" :label="$t('auditLogs.viewTab')" />
        </q-tabs>
        <div class="audit-toolbar-actions">
          <q-input
            v-model="searchQuery"
            dense
            outlined
            clearable
            debounce="300"
            class="audit-search"
            :placeholder="$t('auditLogs.search')"
            @update:model-value="handleSearch"
          >
            <template #prepend>
              <q-icon name="search" />
            </template>
          </q-input>
        </div>
      </q-card-section>

      <q-tab-panels v-model="activeTab" animated>
        <q-tab-panel name="audit" class="q-pa-none">
          <q-banner v-if="auditError" rounded class="q-ma-md status-banner status-banner-danger">
            {{ $t('auditLogs.loadFailed') }}
          </q-banner>
          <q-table
            v-model:pagination="auditPagination"
            flat
            dense
            binary-state-sort
            row-key="id"
            class="audit-table"
            :rows="auditRows"
            :columns="auditColumns"
            :loading="auditLoading"
            :rows-per-page-options="[10, 20, 50]"
            @request="handleAuditRequest"
          >
            <template #body-cell-created_at="props">
              <q-td :props="props">
                {{ formatDate(props.row.created_at) }}
              </q-td>
            </template>
            <template #body-cell-actor="props">
              <q-td :props="props">
                <div class="log-primary">
                  {{ props.row.actor_name || props.row.actor_email || $t('auditLogs.unknownUser') }}
                </div>
                <div v-if="props.row.actor_email" class="log-secondary">
                  {{ props.row.actor_email }}
                </div>
              </q-td>
            </template>
            <template #body-cell-resource="props">
              <q-td :props="props">
                <div class="log-primary">{{ resourceLabel(props.row) }}</div>
                <div class="log-secondary">{{ props.row.request_path || '-' }}</div>
              </q-td>
            </template>
            <template #body-cell-summary="props">
              <q-td :props="props">
                {{ props.row.summary || actionLabel(props.row.action) }}
              </q-td>
            </template>
            <template #body-cell-state="props">
              <q-td :props="props" class="state-cell">
                <q-btn
                  v-if="hasAuditDetails(props.row)"
                  flat
                  dense
                  no-caps
                  color="primary"
                  icon="manage_search"
                  :label="$t('auditLogs.inspect')"
                  @click="openInspector('audit', props.row)"
                />
              </q-td>
            </template>
            <template #no-data>
              <div class="full-width q-pa-md">
                <q-banner rounded class="banner-info">
                  {{ $t('auditLogs.noData') }}
                </q-banner>
              </div>
            </template>
          </q-table>
        </q-tab-panel>

        <q-tab-panel name="views" class="q-pa-none">
          <q-banner v-if="viewError" rounded class="q-ma-md status-banner status-banner-danger">
            {{ $t('auditLogs.loadFailed') }}
          </q-banner>
          <q-table
            v-model:pagination="viewPagination"
            flat
            dense
            binary-state-sort
            row-key="id"
            class="audit-table"
            :rows="viewRows"
            :columns="viewColumns"
            :loading="viewLoading"
            :rows-per-page-options="[10, 20, 50]"
            @request="handleViewRequest"
          >
            <template #body-cell-created_at="props">
              <q-td :props="props">
                {{ formatDate(props.row.created_at) }}
              </q-td>
            </template>
            <template #body-cell-viewer="props">
              <q-td :props="props">
                <div class="log-primary">
                  {{
                    props.row.viewer_name || props.row.viewer_email || $t('auditLogs.unknownUser')
                  }}
                </div>
                <div v-if="props.row.viewer_email" class="log-secondary">
                  {{ props.row.viewer_email }}
                </div>
              </q-td>
            </template>
            <template #body-cell-page="props">
              <q-td :props="props">
                <div class="log-primary">{{ pageLabel(props.row) }}</div>
                <div class="log-secondary">{{ props.row.route_path }}</div>
              </q-td>
            </template>
            <template #body-cell-summary="props">
              <q-td :props="props">
                {{ props.row.summary || $t('auditLogs.viewedPage') }}
              </q-td>
            </template>
            <template #body-cell-state="props">
              <q-td :props="props" class="state-cell">
                <q-btn
                  v-if="props.row.context"
                  flat
                  dense
                  no-caps
                  color="primary"
                  icon="manage_search"
                  :label="$t('auditLogs.inspect')"
                  @click="openInspector('view', props.row)"
                />
              </q-td>
            </template>
            <template #no-data>
              <div class="full-width q-pa-md">
                <q-banner rounded class="banner-info">
                  {{ $t('auditLogs.noData') }}
                </q-banner>
              </div>
            </template>
          </q-table>
        </q-tab-panel>
      </q-tab-panels>
    </q-card>

    <q-dialog v-model="inspectorOpen" :maximized="$q.screen.lt.md">
      <q-card flat bordered class="panel-card audit-inspector-card">
        <q-card-section class="audit-inspector-header">
          <div>
            <div class="panel-title">{{ inspectorTitle }}</div>
            <div class="panel-subtitle">{{ inspectorSubtitle }}</div>
          </div>
          <q-btn
            flat
            dense
            round
            icon="close"
            :aria-label="$t('auditLogs.close')"
            @click="closeInspector"
          />
        </q-card-section>
        <q-card-section class="audit-inspector-body">
          <div
            v-for="section in inspectorSections"
            :key="section.key"
            class="audit-inspector-section"
          >
            <div class="audit-inspector-section-title">{{ section.label }}</div>
            <pre class="audit-json">{{ prettyJson(section.value) }}</pre>
          </div>
          <q-banner v-if="!inspectorSections.length" rounded class="banner-info">
            {{ $t('auditLogs.noDetails') }}
          </q-banner>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { defineComponent } from 'vue'
import { Notify } from 'quasar'
import { api } from 'boot/axios'
import { AUTO_REFRESH_INTERVAL_MS, buildSnapshot } from 'src/utils/auto-refresh'

function defaultPagination() {
  return {
    sortBy: 'created_at',
    descending: true,
    page: 1,
    rowsPerPage: 20,
    rowsNumber: 0,
  }
}

export default defineComponent({
  name: 'AuditLogsPage',
  data() {
    return {
      activeTab: 'audit',
      searchQuery: '',
      auditRows: [],
      auditLoading: false,
      auditError: false,
      auditPagination: defaultPagination(),
      viewRows: [],
      viewLoading: false,
      viewError: false,
      viewPagination: defaultPagination(),
      inspectorOpen: false,
      inspectorKind: 'audit',
      inspectorRow: null,
      autoRefreshTimer: null,
      autoRefreshPending: false,
    }
  },
  computed: {
    auditColumns() {
      return [
        {
          name: 'created_at',
          label: this.$t('auditLogs.timestamp'),
          field: 'created_at',
          align: 'left',
          sortable: true,
        },
        {
          name: 'actor',
          label: this.$t('auditLogs.user'),
          field: 'actor_name',
          align: 'left',
          sortable: false,
        },
        {
          name: 'action',
          label: this.$t('auditLogs.action'),
          field: 'action',
          align: 'left',
          sortable: false,
        },
        {
          name: 'resource',
          label: this.$t('auditLogs.resource'),
          field: 'resource_label',
          align: 'left',
          sortable: false,
        },
        {
          name: 'summary',
          label: this.$t('auditLogs.summary'),
          field: 'summary',
          align: 'left',
          sortable: false,
        },
        {
          name: 'state',
          label: this.$t('auditLogs.details'),
          field: 'id',
          align: 'right',
          sortable: false,
        },
      ]
    },
    viewColumns() {
      return [
        {
          name: 'created_at',
          label: this.$t('auditLogs.timestamp'),
          field: 'created_at',
          align: 'left',
          sortable: true,
        },
        {
          name: 'viewer',
          label: this.$t('auditLogs.user'),
          field: 'viewer_name',
          align: 'left',
          sortable: false,
        },
        {
          name: 'page',
          label: this.$t('auditLogs.page'),
          field: 'page_key',
          align: 'left',
          sortable: false,
        },
        {
          name: 'summary',
          label: this.$t('auditLogs.summary'),
          field: 'summary',
          align: 'left',
          sortable: false,
        },
        {
          name: 'state',
          label: this.$t('auditLogs.details'),
          field: 'id',
          align: 'right',
          sortable: false,
        },
      ]
    },
    inspectorTitle() {
      if (!this.inspectorRow) {
        return this.$t('auditLogs.details')
      }

      return this.inspectorKind === 'audit'
        ? `${this.actionLabel(this.inspectorRow.action)} · ${this.resourceLabel(this.inspectorRow)}`
        : `${this.$t('auditLogs.viewTab')} · ${this.pageLabel(this.inspectorRow)}`
    },
    inspectorSubtitle() {
      if (!this.inspectorRow) {
        return ''
      }

      return this.formatDate(this.inspectorRow.created_at)
    },
    inspectorSections() {
      if (!this.inspectorRow) {
        return []
      }

      if (this.inspectorKind === 'audit') {
        return [
          {
            key: 'before',
            label: this.$t('auditLogs.beforeState'),
            value: this.inspectorRow.before_state,
          },
          {
            key: 'after',
            label: this.$t('auditLogs.afterState'),
            value: this.inspectorRow.after_state,
          },
          {
            key: 'metadata',
            label: this.$t('auditLogs.metadata'),
            value: this.inspectorRow.metadata,
          },
        ].filter((section) => section.value)
      }

      return [
        { key: 'context', label: this.$t('auditLogs.context'), value: this.inspectorRow.context },
      ].filter((section) => section.value)
    },
  },
  async mounted() {
    await this.loadAuditLogs()
    this.startAutoRefresh()
  },
  beforeUnmount() {
    this.stopAutoRefresh()
  },
  methods: {
    startAutoRefresh() {
      this.stopAutoRefresh()
      this.autoRefreshTimer = window.setInterval(() => {
        this.runAutoRefresh()
      }, AUTO_REFRESH_INTERVAL_MS)
    },
    stopAutoRefresh() {
      if (this.autoRefreshTimer) {
        window.clearInterval(this.autoRefreshTimer)
        this.autoRefreshTimer = null
      }
    },
    shouldAutoRefresh() {
      return (
        !this.inspectorOpen &&
        !this.autoRefreshPending &&
        !this.auditLoading &&
        !this.viewLoading
      )
    },
    createAutoRefreshSnapshot() {
      if (this.activeTab === 'audit') {
        return buildSnapshot({
          rows: this.auditRows,
          pagination: this.auditPagination,
        })
      }

      return buildSnapshot({
        rows: this.viewRows,
        pagination: this.viewPagination,
      })
    },
    async refreshPageState() {
      if (this.activeTab === 'audit') {
        await this.loadAuditLogs()
        return
      }

      await this.loadViewLogs()
    },
    async runAutoRefresh() {
      if (!this.shouldAutoRefresh()) {
        return
      }

      const previousSnapshot = this.createAutoRefreshSnapshot()
      this.autoRefreshPending = true

      try {
        await this.refreshPageState()
        if (previousSnapshot !== this.createAutoRefreshSnapshot()) {
          Notify.create({
            type: 'info',
            message: this.$t('app.autoRefreshNotice'),
          })
        }
      } finally {
        this.autoRefreshPending = false
      }
    },
    async handleTabChange(tab) {
      if (tab === 'audit') {
        await this.loadAuditLogs()
        return
      }

      await this.loadViewLogs()
    },
    async handleSearch() {
      if (this.activeTab === 'audit') {
        this.auditPagination.page = 1
        await this.loadAuditLogs()
        return
      }

      this.viewPagination.page = 1
      await this.loadViewLogs()
    },
    async handleAuditRequest(props) {
      await this.loadAuditLogs(props.pagination)
    },
    async handleViewRequest(props) {
      await this.loadViewLogs(props.pagination)
    },
    async loadAuditLogs(pagination = this.auditPagination) {
      this.auditLoading = true
      this.auditError = false

      const normalized = {
        ...this.auditPagination,
        page: pagination.page || 1,
        rowsPerPage: pagination.rowsPerPage || this.auditPagination.rowsPerPage,
        sortBy: 'created_at',
        descending: true,
      }

      try {
        const { data } = await api.get('audit/log', {
          params: {
            q: this.searchQuery.trim(),
            limit: normalized.rowsPerPage,
            offset: (normalized.page - 1) * normalized.rowsPerPage,
          },
        })
        this.auditRows = data.items || []
        this.auditPagination = {
          ...normalized,
          rowsNumber: Number(data.total || 0),
        }
      } catch {
        this.auditError = true
      } finally {
        this.auditLoading = false
      }
    },
    async loadViewLogs(pagination = this.viewPagination) {
      this.viewLoading = true
      this.viewError = false

      const normalized = {
        ...this.viewPagination,
        page: pagination.page || 1,
        rowsPerPage: pagination.rowsPerPage || this.viewPagination.rowsPerPage,
        sortBy: 'created_at',
        descending: true,
      }

      try {
        const { data } = await api.get('audit/view_log', {
          params: {
            q: this.searchQuery.trim(),
            limit: normalized.rowsPerPage,
            offset: (normalized.page - 1) * normalized.rowsPerPage,
          },
        })
        this.viewRows = data.items || []
        this.viewPagination = {
          ...normalized,
          rowsNumber: Number(data.total || 0),
        }
      } catch {
        this.viewError = true
      } finally {
        this.viewLoading = false
      }
    },
    formatDate(value) {
      if (!value) {
        return ''
      }

      return new Intl.DateTimeFormat(this.$i18n.locale, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(value.replace(' ', 'T')))
    },
    actionLabel(action) {
      return String(action || '').replace(/_/g, ' ')
    },
    resourceLabel(row) {
      const label = row.resource_label ? String(row.resource_label) : ''
      const type = row.resource_type
        ? String(row.resource_type)
        : this.$t('auditLogs.unknownResource')
      const resourceId = row.resource_id ? `#${row.resource_id}` : ''

      return [label || type, resourceId].filter(Boolean).join(' ')
    },
    pageLabel(row) {
      const labels = {
        home: this.$t('app.nav.home'),
        messaging: this.$t('app.nav.messaging'),
        reservations: this.$t('app.nav.reservations'),
        profile: this.$t('app.profile'),
        users_admin: this.$t('app.usersAdmin'),
        audit_logs: this.$t('app.auditLogs'),
      }

      return labels[row.page_key] || row.resource_label || row.page_key
    },
    hasAuditDetails(row) {
      return Boolean(row.before_state || row.after_state || row.metadata)
    },
    openInspector(kind, row) {
      this.inspectorKind = kind
      this.inspectorRow = row
      this.inspectorOpen = true
    },
    closeInspector() {
      this.inspectorOpen = false
      this.inspectorRow = null
    },
    prettyJson(value) {
      return JSON.stringify(value || {}, null, 2)
    },
  },
})
</script>

<style scoped>
.audit-toolbar {
  display: flex;
  gap: 1rem;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
}

.audit-toolbar-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
}

.audit-tabs {
  min-height: auto;
}

.audit-search {
  min-width: min(24rem, 80vw);
}

.audit-table {
  min-height: 20rem;
}

.log-primary {
  font-weight: 600;
}

.log-secondary {
  font-size: 0.85rem;
  opacity: 0.72;
}

.state-cell {
  white-space: nowrap;
}

.audit-inspector-card {
  width: min(960px, 96vw);
}

.audit-inspector-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
}

.audit-inspector-body {
  display: grid;
  gap: 1rem;
}

.audit-inspector-section-title {
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.audit-json {
  margin: 0;
  padding: 1rem;
  border-radius: 0.75rem;
  overflow: auto;
  background: color-mix(in srgb, var(--app-surface) 92%, black 8%);
  border: 1px solid color-mix(in srgb, var(--app-border) 84%, transparent);
  font-size: 0.85rem;
  line-height: 1.45;
}

@media (max-width: 900px) {
  .audit-search {
    min-width: 100%;
  }
}
</style>
