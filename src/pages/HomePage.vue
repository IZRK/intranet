<template>
  <q-page class="page-wrap">
    <section class="content-header">
      <div class="content-header-row">
        <div>
          <h1 class="page-title">{{ bulletin.page?.title || $t('home.title') }}</h1>
          <p class="page-lead">{{ $t('home.lead') }}</p>
        </div>
        <div class="bulletin-header-actions">
          <q-btn
            flat
            no-caps
            color="primary"
            :label="showHistory ? $t('home.hideHistory') : $t('home.showHistory')"
            @click="toggleHistory"
          />
          <q-btn
            unelevated
            color="primary"
            :label="editing ? $t('home.cancelEdit') : $t('home.edit')"
            @click="toggleEdit"
          />
        </div>
      </div>
    </section>

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
        <div v-if="bulletin.page?.updated_at" class="bulletin-meta">{{ bulletinMeta }}</div>
        <div class="bulletin-html" v-html="bulletin.page?.body"></div>
      </q-card-section>
    </q-card>

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
  </q-page>
</template>

<script>
import { defineComponent } from 'vue'
import { Notify } from 'quasar'
import { i18n } from 'boot/i18n'
import { useBulletinStore } from 'stores/bulletin-store'

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
    bulletinMeta() {
      if (!this.bulletin.page?.updated_at) {
        return ''
      }

      return this.$t('home.lastUpdatedBy', {
        author: this.bulletin.page.author_name || this.$t('home.unknownAuthor'),
        date: this.formatDate(this.bulletin.page.updated_at),
      })
    },
  },
  async mounted() {
    await this.bulletin.loadPage()
    this.syncDraft()
  },
  methods: {
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
        Notify.create({ type: 'positive', message: this.$t('home.saveSuccess') })
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
