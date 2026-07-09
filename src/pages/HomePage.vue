<template>
  <q-page class="page-wrap">
    <section class="content-header">
      <div class="content-header-row">
        <div>
          <h1 class="page-title">{{ bulletin.page?.title || $t('home.title') }}</h1>
        </div>
      </div>
    </section>

    <div class="home-grid">
      <section class="home-grid-column">
        <q-card flat bordered class="panel-card bulletin-card">
          <q-card-section v-if="editing" class="q-gutter-md">
            <q-input v-model="draft.title" outlined :label="$t('home.editorTitle')" />
            <q-editor
              v-model="draft.body"
              min-height="20rem"
              :toolbar="editorToolbar"
              :fonts="editorFonts"
            />
            <div class="bulletin-editor-actions">
              <q-btn
                unelevated
                color="primary"
                :label="$t('home.save')"
                :loading="bulletin.saving"
                @click="save"
              />
              <q-btn flat no-caps color="primary" :label="$t('home.cancelEdit')" @click="cancelEdit" />
            </div>
          </q-card-section>

          <q-card-section v-else class="bulletin-view">
            <q-btn
              flat
              round
              dense
              color="primary"
              icon="edit"
              class="bulletin-edit-button"
              :aria-label="$t('home.edit')"
              @click="toggleEdit"
            >
              <q-tooltip>{{ $t('home.edit') }}</q-tooltip>
            </q-btn>
            <div class="bulletin-html" v-html="bulletin.page?.body"></div>
          </q-card-section>
        </q-card>

        <button
          v-if="!editing && bulletin.page?.updated_at"
          type="button"
          class="bulletin-meta bulletin-meta-link bulletin-meta-outside"
          @click="toggleHistory"
        >
          {{ bulletinMeta }}
        </button>

        <q-card v-if="showHistory" flat bordered class="panel-card history-card">
          <q-card-section class="row items-center justify-between">
            <div>
              <div class="panel-title">{{ $t('home.historyTitle') }}</div>
              <div class="panel-subtitle">{{ $t('home.historySubtitle') }}</div>
            </div>
            <q-btn
              v-if="bulletin.historyHasMore"
              flat
              no-caps
              color="primary"
              :label="$t('home.showMoreHistory')"
              :loading="bulletin.historyLoading"
              @click="loadMoreHistory"
            />
          </q-card-section>

          <q-card-section v-if="!bulletin.history.length && !bulletin.historyLoading">
            <q-banner rounded class="banner-info">
              {{ $t('home.noHistory') }}
            </q-banner>
          </q-card-section>

          <q-list v-else separator class="history-list">
            <q-expansion-item
              v-for="item in bulletin.history"
              :key="item.id"
              class="history-item"
              expand-separator
              switch-toggle-side
              header-class="history-item-header"
            >
              <template #header>
                <q-item-section>
                  <q-item-label class="history-snippet">{{ revisionSnippet(item.body) }}</q-item-label>
                  <q-item-label caption>{{ revisionMeta(item) }}</q-item-label>
                  <q-item-label caption class="history-diff-summary">{{ diffSummary(item) }}</q-item-label>
                </q-item-section>
              </template>

              <q-card flat class="history-body">
                <q-card-section class="q-gutter-md">
                  <div class="history-subject">{{ item.title }}</div>
                  <div class="bulletin-html" v-html="item.body"></div>
                  <q-btn
                    flat
                    no-caps
                    color="primary"
                    :label="expandedDiffs[item.id] ? $t('home.hideFullDiff') : $t('home.showFullDiff')"
                    @click.stop="toggleFullDiff(item.id)"
                  />
                  <div v-if="expandedDiffs[item.id]" class="diff-table-wrap">
                    <table class="diff-table">
                      <tbody>
                        <tr
                          v-for="(row, index) in diffRows(item)"
                          :key="`${item.id}-${index}`"
                          :class="`diff-row-${row.type}`"
                        >
                          <td class="diff-marker">{{ diffMarker(row.type) }}</td>
                          <td class="diff-line" v-text="row.text || ' '"></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </q-card-section>
              </q-card>
            </q-expansion-item>
          </q-list>
        </q-card>
      </section>

      <section class="home-grid-column">
        <q-card flat bordered class="panel-card kadris-status-card">
          <q-card-section class="kadris-status-toolbar">
            <div>
              <div class="panel-title">{{ $t('home.statusesTitle') }}</div>
              <div class="panel-subtitle">{{ kadrisMeta }}</div>
            </div>
            <q-btn
              flat
              round
              dense
              color="primary"
              icon="refresh"
              :aria-label="$t('home.refreshStatuses')"
              :loading="bulletin.kadrisLoading"
              @click="loadKadrisStatuses"
            >
              <q-tooltip>{{ $t('home.refreshStatuses') }}</q-tooltip>
            </q-btn>
          </q-card-section>

          <q-card-section v-if="!bulletin.kadrisLoading && !bulletin.kadrisStatuses.length">
            <q-banner rounded class="banner-info">
              {{ $t('home.noStatuses') }}
            </q-banner>
          </q-card-section>

          <q-table
            v-else
            flat
            :rows="bulletin.kadrisStatuses"
            :columns="statusColumns"
            row-key="id"
            :loading="bulletin.kadrisLoading"
            :pagination="{ rowsPerPage: 0 }"
            hide-pagination
            class="kadris-status-table"
          >
            <template #body-cell-user_name="props">
              <q-td :props="props">
                <span class="kadris-cell-text">{{ props.row.user_name }}</span>
              </q-td>
            </template>

            <template #body-cell-status_short="props">
              <q-td :props="props">
                <span class="kadris-status-label">
                  <span class="kadris-status-emoji" aria-hidden="true">{{ statusEmoji(props.row) }}</span>
                  <span v-if="statusShortLabel(props.row)">{{ statusShortLabel(props.row) }}</span>
                </span>
              </q-td>
            </template>

            <template #body-cell-status_label="props">
              <q-td :props="props">
                <span class="kadris-cell-text">{{ longStatusLabel(props.row) }}</span>
              </q-td>
            </template>

            <template #body-cell-started_at="props">
              <q-td :props="props">
                <span class="kadris-cell-text">{{ attendanceTime(props.row) || $t('home.statusAllDay') }}</span>
              </q-td>
            </template>

            <template #body-cell-availability="props">
              <q-td :props="props">
                <q-badge :class="`availability-badge availability-${availabilityState(props.row)}`" rounded>
                  {{ availabilityLabel(props.row) }}
                </q-badge>
              </q-td>
            </template>
          </q-table>
        </q-card>
      </section>
    </div>
  </q-page>
</template>

<script>
import { defineComponent } from 'vue'
import { Notify } from 'quasar'
import { i18n } from 'boot/i18n'
import { useBulletinStore } from 'stores/bulletin-store'
import { AUTO_REFRESH_INTERVAL_MS, buildSnapshot } from 'src/utils/auto-refresh'

function stripHtml(html) {
  return String(html || '')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeLines(html) {
  const text = stripHtml(html)
  if (!text) {
    return []
  }

  return text
    .split(/(?<=[.!?])\s+/)
    .map((line) => line.trim())
    .filter(Boolean)
}

function buildDiffRows(currentHtml, previousHtml) {
  const previous = normalizeLines(previousHtml)
  const current = normalizeLines(currentHtml)
  const m = previous.length
  const n = current.length
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))

  for (let i = m - 1; i >= 0; i -= 1) {
    for (let j = n - 1; j >= 0; j -= 1) {
      dp[i][j] = previous[i] === current[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }

  const rows = []
  let i = 0
  let j = 0

  while (i < m && j < n) {
    if (previous[i] === current[j]) {
      rows.push({ type: 'same', text: current[j] })
      i += 1
      j += 1
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      rows.push({ type: 'removed', text: previous[i] })
      i += 1
    } else {
      rows.push({ type: 'added', text: current[j] })
      j += 1
    }
  }

  while (i < m) {
    rows.push({ type: 'removed', text: previous[i] })
    i += 1
  }

  while (j < n) {
    rows.push({ type: 'added', text: current[j] })
    j += 1
  }

  return rows
}

export default defineComponent({
  name: 'HomePage',
  data() {
    return {
      bulletin: useBulletinStore(),
      editing: false,
      showHistory: false,
      expandedDiffs: {},
      draft: {
        title: '',
        body: '',
      },
      autoRefreshTimer: null,
      autoRefreshPending: false,
      editorFonts: {
        sans: 'Source Sans 3',
        serif: 'Playfair Display',
        mono: 'Courier New',
      },
      editorToolbar: [
        ['left', 'center', 'right', 'justify'],
        ['bold', 'italic', 'underline', 'strike', 'subscript', 'superscript'],
        ['quote', 'unordered', 'ordered', 'outdent', 'indent'],
        ['link', 'hr', 'removeFormat'],
        ['undo', 'redo'],
        [
          {
            label: i18n.global.t('home.editorFormatting'),
            icon: 'format_size',
            fixedLabel: true,
            list: 'no-icons',
            options: ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'code'],
          },
          {
            label: i18n.global.t('home.editorFont'),
            icon: 'font_download',
            fixedLabel: true,
            options: ['sans', 'serif', 'mono'],
          },
          'fontSize',
          'textColor',
          'bgColor',
        ],
        ['print', 'fullscreen', 'viewsource'],
      ],
    }
  },
  computed: {
    statusColumns() {
      return [
        { name: 'user_name', label: this.$t('home.statusUser'), field: 'user_name', align: 'left', sortable: true },
        { name: 'status_short', label: this.$t('home.statusShort'), field: 'status_code', align: 'left', sortable: true },
        { name: 'status_label', label: this.$t('home.statusLong'), field: 'status_label', align: 'left', sortable: true },
        {
          name: 'started_at',
          label: this.$t('home.statusStart'),
          field: this.attendanceTimeValue,
          align: 'left',
          sortable: true,
          sort: (left, right, rowLeft, rowRight) => this.attendanceTimeSortValue(rowLeft) - this.attendanceTimeSortValue(rowRight),
        },
        {
          name: 'availability',
          label: this.$t('home.statusAvailability'),
          field: this.availabilityState,
          align: 'left',
          sortable: true,
          sort: (left, right, rowLeft, rowRight) => {
            const diff = this.availabilitySortValue(rowLeft) - this.availabilitySortValue(rowRight)
            return diff || String(rowLeft.user_name || '').localeCompare(String(rowRight.user_name || ''), this.$i18n.locale)
          },
        },
      ]
    },
    bulletinMeta() {
      if (!this.bulletin.page?.updated_at) {
        return ''
      }

      return this.$t('home.lastUpdatedBy', {
        author: this.bulletin.page.author_name || this.$t('home.unknownAuthor'),
        date: this.formatDate(this.bulletin.page.updated_at),
      })
    },
    kadrisMeta() {
      if (!this.bulletin.kadrisSyncedAt) {
        return this.$t('home.statusesNotSynced')
      }

      return this.$t('home.statusesSyncedAt', {
        date: this.formatDate(this.bulletin.kadrisSyncedAt),
      })
    },
  },
  async mounted() {
    await this.bulletin.loadPage()
    await this.loadKadrisStatuses()
    this.syncDraft()
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
      return !this.editing && !this.bulletin.saving && !this.autoRefreshPending
    },
    createAutoRefreshSnapshot() {
      return buildSnapshot({
        page: this.bulletin.page,
        kadrisStatuses: this.bulletin.kadrisStatuses,
        kadrisSyncedAt: this.bulletin.kadrisSyncedAt,
        history: this.showHistory ? this.bulletin.history : [],
        historyHasMore: this.showHistory ? this.bulletin.historyHasMore : false,
        historyTotal: this.showHistory ? this.bulletin.historyTotal : 0,
      })
    },
    async refreshPageState() {
      await this.bulletin.loadPage()
      await this.loadKadrisStatuses()

      if (this.showHistory) {
        await this.bulletin.loadHistory({
          limit: Math.max(this.bulletin.history.length, 10),
        })
      }
    },
    async runAutoRefresh() {
      if (!this.shouldAutoRefresh()) {
        return
      }

      this.autoRefreshPending = true

      try {
        await this.refreshPageState()
      } finally {
        this.autoRefreshPending = false
      }
    },
    syncDraft() {
      this.draft.title = this.bulletin.page?.title || this.$t('home.title')
      this.draft.body = this.bulletin.page?.body || ''
    },
    toggleEdit() {
      if (this.editing) {
        this.cancelEdit()
        return
      }

      this.syncDraft()
      this.editing = true
    },
    cancelEdit() {
      this.editing = false
      this.syncDraft()
    },
    async save() {
      try {
        await this.bulletin.savePage({
          title: this.draft.title,
          body: this.draft.body,
        })
        this.editing = false
        if (this.showHistory) {
          await this.bulletin.loadHistory()
        }
      } catch {
        Notify.create({ type: 'negative', message: this.$t('home.saveFailed') })
      }
    },
    async toggleHistory() {
      this.showHistory = !this.showHistory
      if (this.showHistory && !this.bulletin.history.length) {
        await this.bulletin.loadHistory()
      }
    },
    async loadMoreHistory() {
      await this.bulletin.loadHistory({
        offset: this.bulletin.history.length,
        limit: 10,
        append: true,
      })
    },
    async loadKadrisStatuses() {
      try {
        await this.bulletin.loadKadrisStatuses()
      } catch {
        Notify.create({ type: 'negative', message: this.$t('home.statusesLoadFailed') })
      }
    },
    revisionMeta(item) {
      return this.$t('home.revisionMeta', {
        author: item.author_name || this.$t('home.unknownAuthor'),
        date: this.formatDate(item.created_at),
      })
    },
    revisionSnippet(body) {
      const text = stripHtml(body)
      if (text.length <= 140) {
        return text || this.$t('home.emptyRevision')
      }

      return `${text.slice(0, 140)}...`
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
    statusShortLabel(row) {
      if (this.isZanKafol(row)) {
        return ''
      }
      if (this.isFinishedWork(row)) {
        return ''
      }
      if (!row.status_code || row.status_code === 'NO_DATA') {
        return this.$t('home.statusShortUnknown')
      }

      return row.status_code
    },
    statusEmoji(row) {
      return this.isZanKafol(row) ? '🦅' : row.status_emoji
    },
    longStatusLabel(row) {
      return this.isZanKafol(row) ? this.$t('home.availabilityExternal') : row.status_label
    },
    isZanKafol(row) {
      return Number(row.user_id) === 2
    },
    isFinishedWork(row) {
      return row.status_code === 'FINISHED_WORK' || row.status_group === 'finished_work'
    },
    isFullDayAbsence(row) {
      return ['leave', 'sick_leave'].includes(row.status_group)
    },
    attendanceTimeValue(row) {
      if (this.isFullDayAbsence(row)) {
        return null
      }
      return this.isFinishedWork(row) ? row.ended_at : row.started_at
    },
    attendanceTime(row) {
      return this.formatTime(this.attendanceTimeValue(row))
    },
    attendanceTimeSortValue(row) {
      if (this.isFullDayAbsence(row)) {
        return 0
      }

      const value = this.attendanceTimeValue(row)
      if (!value) {
        return Number.MAX_SAFE_INTEGER
      }

      const timestamp = new Date(value.replace(' ', 'T')).getTime()
      return Number.isFinite(timestamp) ? timestamp : Number.MAX_SAFE_INTEGER
    },
    availabilityState(row) {
      if (this.isZanKafol(row)) return 'external'
      if (['office', 'home', 'business_trip'].includes(row.status_group)) return 'present'
      if (['leave', 'sick_leave', 'finished_work'].includes(row.status_group)) return 'away'
      return 'unknown'
    },
    availabilitySortValue(row) {
      const ranks = {
        present: 1,
        external: 2,
        away: 3,
        unknown: 4,
      }

      return ranks[this.availabilityState(row)] || ranks.unknown
    },
    availabilityLabel(row) {
      const state = this.availabilityState(row)
      if (state === 'present') return this.$t('home.availabilityPresent')
      if (state === 'away') return this.$t('home.availabilityAway')
      if (state === 'external') return this.$t('home.omnipresent')
      return this.$t('home.availabilityUnknown')
    },
    formatTime(value) {
      if (!value) {
        return ''
      }

      return new Intl.DateTimeFormat(this.$i18n.locale, {
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(value.replace(' ', 'T')))
    },
    diffRows(item) {
      return buildDiffRows(item.body, item.previous_body)
    },
    diffSummary(item) {
      const summary = this.diffRows(item).reduce(
        (acc, row) => {
          if (row.type === 'added') {
            acc.added += 1
          } else if (row.type === 'removed') {
            acc.removed += 1
          }
          return acc
        },
        { added: 0, removed: 0 }
      )

      return this.$t('home.diffSummary', summary)
    },
    toggleFullDiff(id) {
      this.expandedDiffs = {
        ...this.expandedDiffs,
        [id]: !this.expandedDiffs[id],
      }
    },
    diffMarker(type) {
      if (type === 'added') return '+'
      if (type === 'removed') return '-'
      return ' '
    },
  },
})
</script>
