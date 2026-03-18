<template>
  <q-page class="page-wrap">
    <section class="content-header">
      <div class="content-header-row">
        <div>
          <h1 class="page-title">{{ $t('messaging.title') }}</h1>
          <p class="page-lead">{{ $t('messaging.lead') }}</p>
        </div>
        <q-btn
          v-if="auth.isAuthenticated"
          unelevated
          color="primary"
          :label="
            showGroupsPanel ? $t('messaging.hideGroupsPanel') : $t('messaging.showGroupsPanel')
          "
          @click="toggleGroupsPanel"
        />
      </div>
    </section>
    <div class="page-grid" :class="{ 'page-grid-single': !showGroupsPanel }">
      <q-card v-if="showGroupsPanel" flat bordered class="panel-card">
        <q-card-section class="row items-center justify-between">
          <div>
            <div class="panel-title">{{ $t('messaging.listsTitle') }}</div>
            <div class="panel-subtitle">{{ $t('messaging.manageLists') }}</div>
          </div>
          <q-btn
            v-if="auth.isAuthenticated"
            flat
            dense
            round
            color="primary"
            icon="add"
            class="group-add-button"
            :aria-label="$t('messaging.openGroupEditor')"
            @click="toggleGroupEditor"
          >
            <q-tooltip>{{ $t('messaging.openGroupEditor') }}</q-tooltip>
          </q-btn>
        </q-card-section>

        <q-card-section v-if="!auth.isAuthenticated" class="q-gutter-md">
          <q-banner rounded class="banner-info">
            {{ $t('messaging.loginRequired') }}
          </q-banner>
          <q-btn unelevated color="primary" :label="$t('messaging.goToLogin')" to="/login" />
        </q-card-section>

        <template v-else>
          <q-card-section v-if="messaging.error" class="q-pb-none">
            <q-banner rounded class="status-banner status-banner-danger">
              {{ $t('messaging.loadError') }}
              <template #action>
                <q-btn
                  flat
                  color="primary"
                  :label="$t('messaging.refresh')"
                  @click="messaging.load"
                />
              </template>
            </q-banner>
          </q-card-section>

          <q-card-section>
            <q-list bordered separator class="rounded-borders">
              <q-item v-for="group in messaging.groups" :key="group.id">
                <q-item-section>
                  <q-item-label>{{ group.name }}</q-item-label>
                  <q-item-label caption>
                    {{ group.description || $t('messaging.noDescription') }} ·
                    {{ group.member_count }} {{ $t('messaging.recipients') }}
                  </q-item-label>
                  <q-item-label caption class="group-recipient-line">
                    {{ groupRecipients(group) || $t('messaging.noRecipientsListed') }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side top>
                  <div class="group-item-actions">
                    <q-btn
                      flat
                      dense
                      round
                      icon="edit"
                      :aria-label="$t('messaging.editList')"
                      @click="editGroup(group)"
                    >
                      <q-tooltip>{{ $t('messaging.editList') }}</q-tooltip>
                    </q-btn>
                    <q-btn
                      flat
                      dense
                      round
                      icon="delete"
                      color="negative"
                      :aria-label="$t('messaging.deleteList')"
                      @click="deleteGroup(group)"
                    >
                      <q-tooltip>{{ $t('messaging.deleteList') }}</q-tooltip>
                    </q-btn>
                  </div>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
          <transition name="auth-fade">
            <q-card-section v-if="showGroupEditor" class="q-gutter-md group-editor">
              <div class="panel-title small">{{ $t('messaging.newList') }}</div>
              <q-input v-model="newGroup.name" outlined :label="$t('messaging.listName')" />
              <q-input
                v-model="newGroup.description"
                outlined
                type="textarea"
                :label="$t('messaging.description')"
              />
              <q-select
                v-model="newGroup.userIds"
                outlined
                multiple
                emit-value
                map-options
                option-value="id"
                option-label="name"
                :options="messaging.users"
                :label="$t('messaging.internalUsers')"
              />
              <q-input
                v-model="newGroup.externalEmail"
                outlined
                :label="$t('messaging.externalEmail')"
                :hint="$t('messaging.optional')"
              />
              <q-input
                v-model="newGroup.externalPhone"
                outlined
                :label="$t('messaging.externalPhone')"
                :hint="$t('messaging.optional')"
              />
              <div class="group-editor-actions">
                <q-btn
                  unelevated
                  color="primary"
                  :label="editingGroupId ? $t('messaging.updateList') : $t('messaging.saveList')"
                  @click="saveGroup"
                />
                <q-btn
                  flat
                  no-caps
                  color="primary"
                  :label="$t('messaging.cancel')"
                  @click="closeGroupEditor"
                />
              </div>
            </q-card-section>
          </transition>
        </template>
      </q-card>

      <q-card flat bordered class="panel-card" id="message-composer">
        <q-card-section>
          <div class="panel-title">{{ $t('messaging.newMessage') }}</div>
          <div class="panel-subtitle">{{ $t('messaging.newMessageText') }}</div>
        </q-card-section>
        <q-card-section class="q-gutter-md">
          <div class="method-tabs-wrap">
            <q-tabs
              v-model="form.method"
              align="left"
              dense
              no-caps
              inline-label
              class="method-tabs"
              active-color="primary"
              indicator-color="primary"
            >
              <q-tab
                v-for="option in methodOptions"
                :key="option.value"
                :name="option.value"
                :label="option.label"
                class="method-tab"
              />
            </q-tabs>
            <div class="method-panel" :class="`method-panel-${form.method}`">
              <q-select
                v-model="form.groupId"
                outlined
                emit-value
                map-options
                :label="$t('messaging.group')"
                option-value="id"
                option-label="name"
                :options="messaging.groups"
              />
              <q-input
                :model-value="selectedRecipientsText"
                outlined
                readonly
                :label="$t('messaging.recipientsPreview')"
                :hint="$t('messaging.recipientsPreviewHint')"
                class="copy-field recipients-preview-field"
                @click="copyRecipients"
              />
              <q-select
                v-model="form.cc"
                outlined
                multiple
                use-input
                use-chips
                input-debounce="0"
                option-value="value"
                option-label="label"
                :options="filteredCcOptions"
                :label="$t('messaging.cc')"
                :hint="ccHint"
                @filter="filterCcOptions"
                @new-value="addCcOption"
              >
                <template #option="scope">
                  <q-item v-bind="scope.itemProps">
                    <q-item-section>
                      <q-item-label>{{ scope.opt.label }}</q-item-label>
                      <q-item-label v-if="ccOptionMeta(scope.opt)" caption>
                        {{ ccOptionMeta(scope.opt) }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
              <q-input
                v-if="form.method === 'email'"
                v-model="form.subject"
                outlined
                :label="$t('messaging.subject')"
              />
              <q-editor
                v-if="form.method === 'email'"
                v-model="form.message"
                min-height="12rem"
                :toolbar="editorToolbar"
              />
              <q-input
                v-else
                v-model="form.message"
                outlined
                autogrow
                type="textarea"
                :label="$t('messaging.smsMessage')"
                maxlength="160"
                counter
              />
            </div>
          </div>
          <q-btn
            unelevated
            color="primary"
            :label="$t('messaging.saveMessage')"
            :disable="!auth.isAuthenticated"
            @click="sendMessage"
          />
          <div aria-live="polite" aria-atomic="true">
            <q-banner v-if="delivery" rounded class="status-banner status-banner-success">
              {{
                $t('messaging.deliveryInfo', {
                  count: delivery.recipient_count,
                  group: delivery.group,
                  method: delivery.method,
                })
              }}
            </q-banner>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <q-card flat bordered class="panel-card history-card">
      <q-card-section class="row items-center justify-between">
        <div>
          <div class="panel-title">{{ $t('messaging.historyTitle') }}</div>
          <div class="panel-subtitle">{{ $t('messaging.historySubtitle') }}</div>
        </div>
        <q-btn
          v-if="messaging.historyHasMore"
          flat
          no-caps
          color="primary"
          :label="$t('messaging.showMoreHistory')"
          :loading="messaging.historyLoading"
          @click="loadMoreHistory"
        />
      </q-card-section>
      <q-card-section v-if="!messaging.history.length && !messaging.historyLoading">
        <q-banner rounded class="banner-info">
          {{ $t('messaging.noHistory') }}
        </q-banner>
      </q-card-section>
      <q-list v-else separator class="history-list">
        <q-expansion-item
          v-for="item in messaging.history"
          :key="item.id"
          class="history-item"
          expand-separator
          switch-toggle-side
          header-class="history-item-header"
        >
          <template #header>
            <q-item-section>
              <q-item-label class="history-snippet">{{
                messageSnippet(item.message)
              }}</q-item-label>
              <q-item-label caption>
                {{ historyMeta(item) }}
              </q-item-label>
            </q-item-section>
            <q-item-section side top>
              <q-btn
                flat
                round
                dense
                icon="history"
                color="primary"
                :aria-label="$t('messaging.prefillFromHistory')"
                :title="$t('messaging.prefillFromHistory')"
                @click.stop="prefillFromHistory(item)"
              />
            </q-item-section>
          </template>
          <q-card flat class="history-body">
            <q-card-section>
              <div v-if="item.subject" class="history-subject">{{ item.subject }}</div>
              <div class="history-message" v-html="normalizedHistoryHtml(item.message)"></div>
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
import { useAuthStore } from 'stores/auth-store'
import { useMessagingStore } from 'stores/messaging-store'
import { i18n } from 'boot/i18n'

function normalizeHistoryHtml(html) {
  return String(html || '').replace(/&(nbsp|#160|#xA0);/gi, ' ')
}

function normalizeCcUser(user) {
  const id = Number(user.id)
  const name = String(user.name || '').trim()
  const email = String(user.email || '').trim()
  const mobileNumber = String(user.mobile_number || '').trim()
  const phoneNumber = String(mobileNumber || user.phone_number || '').trim()
  const label = name || email || `#${id}`

  return {
    type: 'user',
    value: `user:${id}`,
    user_id: id,
    label,
    email,
    mobile_number: mobileNumber,
    phone_number: phoneNumber,
    search_text: `${label} ${email} ${mobileNumber} ${phoneNumber}`.trim().toLowerCase(),
  }
}

function normalizeCcEmail(email) {
  const value = String(email || '').trim().toLowerCase()

  return {
    type: 'email',
    value: `email:${value}`,
    label: value,
    email: value,
    phone_number: '',
    search_text: value,
  }
}

function isValidEmail(email) {
  return /^[\w\d_\-+.]+@[\w\d-]+(\.[\w\d-]+)*\.\w\w+$/i.test(String(email || '').trim())
}

export default defineComponent({
  name: 'ObvescanjePage',
  data() {
    return {
      auth: useAuthStore(),
      messaging: useMessagingStore(),
      delivery: null,
      showGroupsPanel: false,
      showGroupEditor: false,
      editingGroupId: null,
      ccDirectory: [],
      ccDirectoryMap: {},
      ccOptions: [],
      filteredCcOptions: [],
      editorToolbar: [['bold', 'italic', 'underline'], ['unordered', 'ordered'], ['link']],
      form: {
        method: 'email',
        groupId: null,
        subject: '',
        message: '',
        cc: [],
      },
      newGroup: {
        name: '',
        description: '',
        userIds: [],
        externalEmail: '',
        externalPhone: '',
      },
    }
  },
  computed: {
    methodOptions() {
      return [
        { label: i18n.global.t('messaging.email'), value: 'email' },
        { label: i18n.global.t('messaging.sms'), value: 'sms' },
      ]
    },
    selectedGroup() {
      return this.messaging.groups.find((group) => group.id === this.form.groupId) || null
    },
    selectedRecipientsText() {
      if (!this.selectedGroup) {
        return ''
      }

      const recipients = (this.selectedGroup.members || [])
        .map((member) => {
          if (this.form.method === 'sms') {
            return member.phone_number || null
          }

          return member.email || null
        })
        .filter(Boolean)

      return recipients.join(', ')
    },
    ccHint() {
      return this.form.method === 'sms'
        ? this.$t('messaging.ccSmsHint')
        : this.$t('messaging.ccHint')
    },
  },
  async mounted() {
    if (this.auth.token) {
      await this.auth.bootstrap()
    }
    if (this.auth.isAuthenticated) {
      await Promise.all([this.messaging.load(), this.messaging.loadHistory()])
      this.rebuildCcDirectory()
    }
  },
  methods: {
    toggleGroupsPanel() {
      this.showGroupsPanel = !this.showGroupsPanel
      if (!this.showGroupsPanel) {
        this.closeGroupEditor()
      }
    },
    toggleGroupEditor() {
      if (this.showGroupEditor) {
        this.closeGroupEditor()
        return
      }

      this.editingGroupId = null
      this.resetNewGroup()
      this.showGroupEditor = true
    },
    closeGroupEditor() {
      this.showGroupEditor = false
      this.editingGroupId = null
    },
    rebuildCcDirectory() {
      const directory = (this.messaging.users || []).map(normalizeCcUser)
      this.ccDirectory = directory
      this.ccDirectoryMap = directory.reduce((acc, option) => {
        acc[option.value] = option
        return acc
      }, {})

      const selectedCustomOptions = (this.form.cc || [])
        .map((item) => item?.value || null)
        .map((value) => this.ccOptions.find((option) => option.value === value))
        .filter((option) => option?.type === 'email')

      this.ccOptions = [...directory, ...selectedCustomOptions]
      this.resetCcOptions()
    },
    resetCcOptions() {
      this.filteredCcOptions = [...this.ccOptions]
    },
    filterCcOptions(value, update) {
      update(() => {
        const needle = String(value || '').trim().toLowerCase()
        const options = !needle
          ? this.ccOptions
          : this.ccOptions.filter((option) => option.search_text.includes(needle))

        this.filteredCcOptions = options
      })
    },
    addCcOption(value, done) {
      const normalizedValue = String(value || '').trim().toLowerCase()
      if (!normalizedValue) {
        done()
        return
      }

      if (!isValidEmail(normalizedValue)) {
        Notify.create({
          type: 'negative',
          message: i18n.global.t('messaging.invalidCcEmail'),
        })
        done()
        return
      }

      const option = normalizeCcEmail(normalizedValue)
      if (!this.ccOptions.some((existing) => existing.value === option.value)) {
        this.ccOptions = [...this.ccOptions, option]
      }
      done(option, 'add-unique')
    },
    resetNewGroup() {
      this.newGroup.name = ''
      this.newGroup.description = ''
      this.newGroup.userIds = []
      this.newGroup.externalEmail = ''
      this.newGroup.externalPhone = ''
    },
    editGroup(group) {
      this.showGroupsPanel = true
      this.showGroupEditor = true
      this.editingGroupId = group.id
      this.newGroup.name = group.name || ''
      this.newGroup.description = group.description || ''
      this.newGroup.userIds = (group.members || [])
        .filter((member) => member.user_id)
        .map((member) => member.user_id)

      const externalMember = (group.members || []).find((member) => !member.user_id)
      this.newGroup.externalEmail = externalMember?.email || ''
      this.newGroup.externalPhone = externalMember?.phone_number || ''
    },
    async saveGroup() {
      const isEditing = Boolean(this.editingGroupId)
      try {
        const members = this.newGroup.userIds.map((userId) => ({ user_id: userId }))
        if (this.newGroup.externalEmail || this.newGroup.externalPhone) {
          members.push({
            external_name: i18n.global.t('messaging.externalContact'),
            email: this.newGroup.externalEmail || null,
            phone_number: this.newGroup.externalPhone || null,
          })
        }

        const payload = {
          name: this.newGroup.name,
          description: this.newGroup.description,
          members,
        }

        if (this.editingGroupId) {
          await this.messaging.updateGroup({
            id: this.editingGroupId,
            ...payload,
          })
        } else {
          await this.messaging.createGroup(payload)
        }

        this.rebuildCcDirectory()

        this.resetNewGroup()
        this.closeGroupEditor()
        Notify.create({
          type: 'positive',
          message: i18n.global.t(
            isEditing ? 'messaging.updateListSuccess' : 'messaging.createListSuccess',
          ),
        })
      } catch {
        Notify.create({
          type: 'negative',
          message: i18n.global.t(
            isEditing ? 'messaging.updateListFailed' : 'messaging.createListFailed',
          ),
        })
      }
    },
    async deleteGroup(group) {
      if (!window.confirm(i18n.global.t('messaging.deleteListConfirm', { name: group.name }))) {
        return
      }

      try {
        await this.messaging.deleteGroup(group.id)
        if (this.editingGroupId === group.id) {
          this.closeGroupEditor()
          this.resetNewGroup()
        }
        Notify.create({ type: 'positive', message: i18n.global.t('messaging.deleteListSuccess') })
      } catch {
        Notify.create({ type: 'negative', message: i18n.global.t('messaging.deleteListFailed') })
      }
    },
    async copyRecipients() {
      if (!this.selectedRecipientsText) {
        return
      }

      try {
        await navigator.clipboard.writeText(this.selectedRecipientsText)
        Notify.create({ type: 'positive', message: i18n.global.t('messaging.recipientsCopied') })
      } catch {
        Notify.create({
          type: 'negative',
          message: i18n.global.t('messaging.recipientsCopyFailed'),
        })
      }
    },
    historyMeta(item) {
      return [
        item.sender_name || this.$t('messaging.unknownSender'),
        item.group_name || this.$t('messaging.unknownGroup'),
        this.formatDate(item.created_at),
      ].join(' · ')
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
    messageSnippet(html) {
      const plain = normalizeHistoryHtml(html)
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()

      if (plain.length <= 120) {
        return plain || this.$t('messaging.emptyHistoryBody')
      }

      return `${plain.slice(0, 120)}...`
    },
    normalizedHistoryHtml(html) {
      return normalizeHistoryHtml(html)
    },
    ccOptionMeta(option) {
      if (option?.type === 'email') {
        return option?.email || ''
      }

      return this.form.method === 'sms'
        ? option?.mobile_number || option?.phone_number || ''
        : option?.email || ''
    },
    async loadMoreHistory() {
      await this.messaging.loadHistory({
        offset: this.messaging.history.length,
        limit: 10,
        append: true,
      })
    },
    prefillFromHistory(item) {
      this.form.method = item.method || 'email'
      this.form.groupId = item.group_id || null
      this.form.subject = item.subject || ''
      this.form.message = item.message || ''
      this.form.cc = []

      document.getElementById('message-composer')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })

      Notify.create({
        type: 'positive',
        message: i18n.global.t('messaging.prefillFromHistorySuccess'),
      })
    },
    groupRecipients(group) {
      const recipients = (group.members || [])
        .map(
          (member) =>
            member.display_name ||
            member.external_name ||
            member.email ||
            member.phone_number ||
            null,
        )
        .filter(Boolean)

      return recipients.join(', ')
    },
    async sendMessage() {
      try {
        const { delivery } = await this.messaging.send({
          method: this.form.method,
          group_id: this.form.groupId,
          subject: this.form.subject,
          message: this.form.message,
          cc: (this.form.cc || []).map((item) => {
            const isSms = this.form.method === 'sms'
            const phoneNumber = item?.mobile_number || item?.phone_number || null

            return {
              user_id: null,
              email: isSms ? null : item?.email || null,
              phone_number: isSms ? phoneNumber : null,
            }
          }),
        })
        this.delivery = delivery
        await this.messaging.loadHistory()
        Notify.create({ type: 'positive', message: i18n.global.t('messaging.messageSaved') })
      } catch {
        Notify.create({ type: 'negative', message: i18n.global.t('messaging.messageSaveFailed') })
      }
    },
  },
})
</script>

<style scoped>
.method-tabs-wrap {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.method-tabs {
  justify-content: flex-start;
  border-bottom: 1px solid color-mix(in srgb, var(--app-border) 55%, transparent);
  padding: 0;
}

.method-tab {
  border-radius: 14px 14px 0 0;
  background: color-mix(in srgb, var(--app-surface) 80%, white 20%);
  color: color-mix(in srgb, var(--app-text) 72%, transparent);
  border: 1px solid transparent;
  border-bottom: 0;
  margin-right: 8px;
}

.method-tab.q-tab--active {
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--q-primary) 18%, white 82%) 0%,
    color-mix(in srgb, var(--app-surface) 92%, white 8%) 100%
  );
  border-color: color-mix(in srgb, var(--q-primary) 42%, var(--app-border) 58%);
  color: var(--app-text);
}

.method-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 18px;
  margin-top: -1px;
  border-radius: 0 18px 18px 18px;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--q-primary) 6%, white 94%) 0%, transparent 100%),
    color-mix(in srgb, var(--app-surface) 96%, white 4%);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--q-primary) 18%, var(--app-border) 82%);
}

.method-panel-sms {
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--q-primary) 10%, white 90%) 0%, transparent 100%),
    color-mix(in srgb, var(--app-surface) 94%, white 6%);
}

.recipients-preview-field :deep(.q-field__control) {
  min-height: 40px;
  background: color-mix(in srgb, var(--app-surface) 72%, white 28%);
  color: color-mix(in srgb, var(--app-text) 68%, transparent);
}

.recipients-preview-field :deep(.q-field__marginal) {
  height: 40px;
}

.recipients-preview-field :deep(.q-field__native),
.recipients-preview-field :deep(.q-field__input) {
  min-height: 40px;
  padding-top: 0;
  padding-bottom: 0;
  color: color-mix(in srgb, var(--app-text) 68%, transparent);
}

.recipients-preview-field :deep(.q-field__label),
.recipients-preview-field :deep(.q-field__bottom) {
  color: color-mix(in srgb, var(--app-text) 58%, transparent);
}

.recipients-preview-field :deep(.q-field__control::before) {
  border-color: color-mix(in srgb, var(--app-border) 55%, transparent);
  border-style: dashed;
}

.recipients-preview-field :deep(.q-field__control:hover::before),
.recipients-preview-field :deep(.q-field--focused .q-field__control::before),
.recipients-preview-field :deep(.q-field--highlighted .q-field__control::before) {
  border-color: color-mix(in srgb, var(--app-border) 60%, transparent);
}

.group-add-button {
  background: color-mix(in srgb, var(--app-surface) 88%, transparent);
  border: 1px solid color-mix(in srgb, var(--app-border) 86%, transparent);
}

.group-item-actions {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 4px;
}
</style>
