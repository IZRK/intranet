<template>
  <q-page class="reservations-page">
    <section class="content-header reservations-header">
      <div class="content-header-row">
        <div>
          <h1 class="page-title">{{ $t('reservations.title') }}</h1>
          <p class="page-lead">{{ $t('reservations.lead') }}</p>
        </div>
        <div class="reservations-header-actions">
          <q-btn flat no-caps color="primary" icon="link" :label="$t('reservations.copyFeed')" @click="copyAllFeed" />
          <q-btn unelevated color="primary" icon="event_available" :label="$t('reservations.addReservation')" @click="openReservationDialog()" />
        </div>
      </div>
    </section>

    <div class="reservations-shell">
      <aside class="reservations-sidebar">
        <q-card flat bordered class="panel-card reservations-sidebar-card">
          <q-card-section class="q-gutter-sm">
            <div class="panel-title">{{ $t('reservations.sidebarTitle') }}</div>
            <div class="sidebar-actions">
              <q-btn class="sidebar-action-btn" unelevated color="primary" icon="add" :label="$t('reservations.addCalendar')" @click="openNewCalendarDialog" />
              <q-btn class="sidebar-action-btn" flat no-caps color="primary" icon="create_new_folder" :label="$t('reservations.addGroup')" @click="openNewGroupDialog" />
              <q-btn class="sidebar-action-btn" flat no-caps color="primary" icon="event" :label="$t('reservations.addReservation')" @click="openReservationDialog()" />
            </div>
          </q-card-section>

          <q-separator />

          <q-card-section class="q-gutter-sm">
            <div class="sidebar-feed-row">
              <div>
                <div class="sidebar-section-title">{{ $t('reservations.allFeeds') }}</div>
                <div class="sidebar-hint">{{ $t('reservations.subscribeHint') }}</div>
              </div>
              <div class="sidebar-feed-actions">
                <q-btn flat dense round icon="content_copy" @click="copyAllFeed" />
                <q-btn
                  v-if="allFeedUrl"
                  flat
                  dense
                  round
                  icon="open_in_new"
                  type="a"
                  :href="allFeedUrl"
                  target="_blank"
                />
              </div>
            </div>
            <q-input :model-value="allFeedUrl" outlined dense readonly />
          </q-card-section>

          <q-separator />

          <q-card-section class="reservations-sidebar-list">
            <div v-if="!reservations.calendars.length" class="sidebar-empty">
              {{ $t('reservations.noCalendars') }}
            </div>
            <q-list v-else separator>
              <template v-for="entry in sidebarEntries" :key="entry.key">
                <q-expansion-item
                  v-if="entry.type === 'group'"
                  v-model="expandedGroups[entry.group.id]"
                  dense
                  dense-toggle
                  expand-separator
                  class="calendar-group-item"
                  header-class="calendar-group-header"
                  expand-icon-toggle
                >
                  <template #header>
                    <q-item-section side>
                      <q-checkbox
                        :model-value="isGroupVisible(entry.group.id)"
                        @update:model-value="toggleGroup(entry.group.id)"
                        @click.stop
                      />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label class="calendar-group-name">{{ entry.group.name }}</q-item-label>
                      <q-item-label caption>
                        {{ groupReservationCount(entry.group.id) }} · {{ entry.calendars.length }} {{ $t('reservations.groupItems') }}
                      </q-item-label>
                    </q-item-section>
                    <q-item-section side top class="calendar-item-actions">
                      <q-btn flat dense round size="sm" icon="edit" :title="$t('reservations.editGroup')" @click.stop="openGroupEditor(entry.group)" />
                      <q-btn flat dense round icon="content_copy" :title="$t('reservations.copyFeed')" @click.stop="copyFeed(entry.group.feed_url)" />
                    </q-item-section>
                  </template>

                  <q-list separator class="calendar-group-children">
                    <q-item
                      v-for="calendar in entry.calendars"
                      :key="calendar.id"
                      clickable
                      class="calendar-toggle-item calendar-toggle-item-child"
                      @click="toggleCalendar(calendar.id)"
                    >
                      <q-item-section side>
                        <q-checkbox :model-value="isCalendarVisible(calendar.id)" @update:model-value="toggleCalendar(calendar.id)" @click.stop />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label class="calendar-toggle-name">
                          <span class="calendar-swatch" :style="{ background: calendar.color }" />
                          {{ calendar.name }}
                        </q-item-label>
                        <q-item-label caption>
                          {{ reservationCount(calendar.id) }} · {{ calendar.allow_overlap ? $t('reservations.overlapAllowed') : $t('reservations.overlapBlocked') }}
                        </q-item-label>
                      </q-item-section>
                      <q-item-section side top class="calendar-item-actions">
                        <q-btn flat dense round size="sm" icon="edit" :title="$t('reservations.editCalendar')" @click.stop="openCalendarEditor(calendar)" />
                        <q-btn flat dense round size="sm" icon="add" :title="$t('reservations.addForCalendar')" @click.stop="openReservationDialog({ calendarId: calendar.id })" />
                        <q-btn flat dense round size="sm" icon="content_copy" :title="$t('reservations.copyFeed')" @click.stop="copyFeed(calendar.feed_url)" />
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-expansion-item>

                <q-item
                  v-else
                  clickable
                  class="calendar-toggle-item"
                  @click="toggleCalendar(entry.calendar.id)"
                >
                  <q-item-section side>
                    <q-checkbox :model-value="isCalendarVisible(entry.calendar.id)" @update:model-value="toggleCalendar(entry.calendar.id)" @click.stop />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="calendar-toggle-name">
                      <span class="calendar-swatch" :style="{ background: entry.calendar.color }" />
                      {{ entry.calendar.name }}
                    </q-item-label>
                    <q-item-label caption>
                      {{ reservationCount(entry.calendar.id) }} · {{ entry.calendar.allow_overlap ? $t('reservations.overlapAllowed') : $t('reservations.overlapBlocked') }}
                    </q-item-label>
                  </q-item-section>
                  <q-item-section side top class="calendar-item-actions">
                    <q-btn flat dense round size="sm" icon="edit" :title="$t('reservations.editCalendar')" @click.stop="openCalendarEditor(entry.calendar)" />
                    <q-btn flat dense round size="sm" icon="add" :title="$t('reservations.addForCalendar')" @click.stop="openReservationDialog({ calendarId: entry.calendar.id })" />
                    <q-btn flat dense round size="sm" icon="content_copy" :title="$t('reservations.copyFeed')" @click.stop="copyFeed(entry.calendar.feed_url)" />
                  </q-item-section>
                </q-item>
              </template>
            </q-list>
          </q-card-section>
        </q-card>
      </aside>

      <section class="reservations-calendar-area">
        <q-card flat bordered class="panel-card reservations-calendar-card">
          <q-card-section class="calendar-toolbar">
            <div class="calendar-toolbar-group">
              <q-btn flat round icon="chevron_left" @click="moveCalendar(-1)" />
              <q-btn flat no-caps color="primary" :label="$t('reservations.today')" @click="moveToToday" />
              <q-btn flat round icon="chevron_right" @click="moveCalendar(1)" />
            </div>
            <div class="calendar-toolbar-center">
              <div class="calendar-title">{{ monthLabel }}</div>
              <div class="calendar-subtitle">
                {{ visibleCalendarSummary }}
              </div>
            </div>
          </q-card-section>

          <q-separator />

          <q-card-section class="reservations-calendar-wrap">
            <q-calendar-month
              ref="calendarRef"
              v-model="viewDate"
              :locale="$i18n.locale"
              animated
              bordered
              date-align="right"
              weekday-align="center"
              :day-min-height="120"
              :day-height="0"
              :hoverable="true"
              :focusable="true"
              :weekdays="[1, 2, 3, 4, 5, 6, 0]"
              @click-day="handleCalendarDayClick"
            >
              <template #day="{ scope }">
                <div class="calendar-day-content">
                  <button class="calendar-day-add" type="button" @click.stop="openReservationDialog({ date: scope.timestamp.date })">
                    <q-icon name="add" size="16px" />
                  </button>
                  <div v-if="eventsForDate(scope.timestamp.date).length" class="calendar-day-events">
                    <button
                      v-for="event in visibleEventsForDate(scope.timestamp.date)"
                      :key="`${scope.timestamp.date}-${event.id}`"
                      type="button"
                      class="calendar-event-chip"
                      :style="eventChipStyle(event)"
                    >
                      <span class="calendar-event-time">{{ reservationTimeLabel(event) }}</span>
                      <span class="calendar-event-title">{{ reservationDisplayName(event) }}</span>
                      <span class="calendar-event-meta">{{ event.calendar_name }}</span>
                      <q-tooltip class="bg-dark text-white">
                        <div>{{ reservationDisplayName(event) }}</div>
                        <div>{{ reservationTimeLabel(event) }}</div>
                        <div>{{ event.calendar_name }}</div>
                        <div v-if="event.details">{{ event.details }}</div>
                      </q-tooltip>
                    </button>
                    <div v-if="hiddenEventsCount(scope.timestamp.date) > 0" class="calendar-more-events">
                      {{ $t('reservations.hiddenMore', { count: hiddenEventsCount(scope.timestamp.date) }) }}
                    </div>
                  </div>
                </div>
              </template>
            </q-calendar-month>
          </q-card-section>
        </q-card>
      </section>
    </div>

    <q-dialog v-model="showCalendarDialog">
      <q-card class="reservation-dialog-card">
        <q-card-section>
          <div class="panel-title">{{ editingCalendarId ? $t('reservations.editCalendar') : $t('reservations.addCalendar') }}</div>
        </q-card-section>
        <q-card-section class="q-gutter-md">
          <q-input v-model="calendarForm.name" outlined autofocus :label="$t('reservations.calendarName')" />
          <q-select
            v-model="calendarForm.group_id"
            outlined
            clearable
            emit-value
            map-options
            option-value="id"
            option-label="name"
            :options="reservations.groups"
            :label="$t('reservations.calendarGroup')"
          />
          <q-input v-model="calendarForm.description" outlined type="textarea" :label="$t('reservations.calendarDescription')" autogrow />
          <div class="color-field">
            <div class="color-field-label">{{ $t('reservations.calendarColor') }}</div>
            <label class="color-swatch-picker">
              <input v-model="calendarForm.color" class="color-swatch-input" type="color" />
              <span class="color-swatch-preview" :style="{ background: calendarForm.color }" />
              <span class="color-swatch-value">{{ calendarForm.color }}</span>
            </label>
          </div>
          <q-toggle v-model="calendarForm.allow_overlap" :label="$t('reservations.allowOverlap')" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat no-caps color="primary" :label="$t('reservations.cancel')" v-close-popup />
          <q-btn unelevated color="primary" :label="$t('reservations.saveCalendar')" :loading="reservations.savingCalendar" @click="saveCalendar" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="showGroupDialog">
      <q-card class="reservation-dialog-card">
        <q-card-section>
          <div class="panel-title">{{ editingGroupId ? $t('reservations.editGroup') : $t('reservations.addGroup') }}</div>
        </q-card-section>
        <q-card-section class="q-gutter-md">
          <q-input v-model="groupForm.name" outlined autofocus :label="$t('reservations.groupName')" />
          <q-input v-model="groupForm.description" outlined type="textarea" :label="$t('reservations.groupDescription')" autogrow />
          <q-select
            v-model="groupForm.calendar_ids"
            outlined
            multiple
            emit-value
            map-options
            option-value="id"
            option-label="name"
            :options="groupAssignableCalendars"
            :label="$t('reservations.groupCalendars')"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat no-caps color="primary" :label="$t('reservations.cancel')" v-close-popup />
          <q-btn unelevated color="primary" :label="$t('reservations.saveGroup')" :loading="reservations.savingGroup" @click="saveGroup" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="showReservationDialog">
      <q-card class="reservation-dialog-card">
        <q-card-section>
          <div class="panel-title">{{ $t('reservations.addReservation') }}</div>
          <div class="panel-subtitle">{{ $t('reservations.selectedDate') }}: {{ reservationForm.start_date }}</div>
        </q-card-section>
        <q-card-section class="q-gutter-md">
          <q-select
            v-model="reservationForm.calendar_id"
            outlined
            autofocus
            emit-value
            map-options
            option-value="id"
            option-label="name"
            :options="reservations.calendars"
            :label="$t('reservations.reservationCalendar')"
          />
          <q-toggle v-model="reservationForm.all_day" :label="$t('reservations.allDay')" />
          <div class="reservation-form-grid">
            <q-input v-model="reservationForm.start_date" outlined readonly :label="$t('reservations.startDate')">
              <template #append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date v-model="reservationForm.start_date" mask="YYYY-MM-DD" />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
            <q-input v-if="!reservationForm.all_day" v-model="reservationForm.start_time" outlined readonly :label="$t('reservations.startTime')">
              <template #append>
                <q-icon name="schedule" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-time v-model="reservationForm.start_time" mask="HH:mm" format24h />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
            <q-input v-model="reservationForm.end_date" outlined readonly :label="$t('reservations.endDate')">
              <template #append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date v-model="reservationForm.end_date" mask="YYYY-MM-DD" />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
            <q-input v-if="!reservationForm.all_day" v-model="reservationForm.end_time" outlined readonly :label="$t('reservations.endTime')">
              <template #append>
                <q-icon name="schedule" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-time v-model="reservationForm.end_time" mask="HH:mm" format24h />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>
          <q-input v-model="reservationForm.details" outlined type="textarea" autogrow :label="$t('reservations.reservationDetails')" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat no-caps color="primary" :label="$t('reservations.cancel')" v-close-popup />
          <q-btn
            unelevated
            color="primary"
            :label="$t('reservations.saveReservation')"
            :loading="reservations.savingReservation"
            @click="saveReservation"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { defineComponent } from 'vue'
import { Notify } from 'quasar'
import { QCalendarMonth } from '@quasar/quasar-ui-qcalendar'
import { useReservationsStore } from 'stores/reservations-store'

function todayDate() {
  return new Date().toISOString().slice(0, 10)
}

function shiftMonth(dateString, amount) {
  const date = new Date(`${dateString}T00:00:00`)
  date.setMonth(date.getMonth() + amount)
  return date.toISOString().slice(0, 10)
}

function monthRange(dateString) {
  const date = new Date(`${dateString}T00:00:00`)
  const start = new Date(date.getFullYear(), date.getMonth(), 1)
  const end = new Date(date.getFullYear(), date.getMonth() + 2, 0, 23, 59, 59)

  return {
    start: start.toISOString().slice(0, 19).replace('T', ' '),
    end: end.toISOString().slice(0, 19).replace('T', ' '),
  }
}

export default defineComponent({
  name: 'RezervacijePage',
  components: {
    QCalendarMonth,
  },
  data() {
    const date = todayDate()

    return {
      reservations: useReservationsStore(),
      viewDate: date,
      visibleCalendarIds: [],
      expandedGroups: {},
      showCalendarDialog: false,
      showGroupDialog: false,
      showReservationDialog: false,
      editingCalendarId: null,
      editingGroupId: null,
      calendarForm: {
        name: '',
        group_id: null,
        description: '',
        color: '#235fa4',
        allow_overlap: false,
      },
      groupForm: {
        name: '',
        description: '',
        calendar_ids: [],
      },
      reservationForm: {
        calendar_id: null,
        all_day: true,
        start_date: date,
        end_date: date,
        start_time: '08:00',
        end_time: '09:00',
        details: '',
      },
    }
  },
  computed: {
    allFeedUrl() {
      return this.reservations.feeds?.all?.url || ''
    },
    groupedCalendars() {
      const map = new Map()
      this.reservations.groups.forEach((group) => {
        map.set(group.id, {
          group,
          calendars: [],
        })
      })
      this.reservations.calendars.forEach((calendar) => {
        if (calendar.group_id && map.has(calendar.group_id)) {
          map.get(calendar.group_id).calendars.push(calendar)
        }
      })
      return Array.from(map.values()).filter((entry) => entry.calendars.length)
    },
    groupAssignableCalendars() {
      return this.reservations.calendars
    },
    ungroupedCalendars() {
      return this.reservations.calendars.filter((calendar) => !calendar.group_id)
    },
    sidebarEntries() {
      const grouped = this.groupedCalendars.map((entry) => ({
        key: `group-${entry.group.id}`,
        type: 'group',
        ...entry,
      }))
      const singles = this.ungroupedCalendars.map((calendar) => ({
        key: `calendar-${calendar.id}`,
        type: 'calendar',
        calendar,
      }))
      return [...grouped, ...singles]
    },
    monthLabel() {
      return new Intl.DateTimeFormat(this.$i18n.locale === 'sl-SI' ? 'sl-SI' : 'en-US', {
        month: 'long',
        year: 'numeric',
      }).format(new Date(`${this.viewDate}T00:00:00`))
    },
    visibleCalendarSummary() {
      return `${this.visibleCalendarIds.length}/${this.reservations.calendars.length} ${this.$t('reservations.allVisible')}`
    },
    defaultCalendarId() {
      return this.visibleCalendarIds[0] || this.reservations.calendars[0]?.id || null
    },
  },
  async mounted() {
    await this.loadOverview()
  },
  methods: {
    async loadOverview() {
      try {
        const range = monthRange(this.viewDate)
        await this.reservations.loadOverview(range)
        this.syncVisibleCalendars()
        this.syncExpandedGroups()
      } catch {
        Notify.create({ type: 'negative', message: this.$t('reservations.loadFailed') })
      }
    },
    syncVisibleCalendars() {
      const ids = this.reservations.calendars.map((calendar) => calendar.id)
      if (!this.visibleCalendarIds.length) {
        this.visibleCalendarIds = [...ids]
        return
      }

      const current = new Set(this.visibleCalendarIds)
      ids.forEach((id) => {
        if (!current.has(id)) {
          current.add(id)
        }
      })
      this.visibleCalendarIds = ids.filter((id) => current.has(id))
    },
    syncExpandedGroups() {
      const nextState = { ...this.expandedGroups }
      this.groupedCalendars.forEach((entry) => {
        if (nextState[entry.group.id] === undefined) {
          nextState[entry.group.id] = true
        }
      })
      this.expandedGroups = nextState
    },
    moveCalendar(direction) {
      this.viewDate = shiftMonth(this.viewDate, direction)
      this.loadOverview()
    },
    moveToToday() {
      this.viewDate = todayDate()
      this.loadOverview()
    },
    toggleCalendar(calendarId) {
      if (this.isCalendarVisible(calendarId)) {
        this.visibleCalendarIds = this.visibleCalendarIds.filter((id) => id !== calendarId)
        return
      }

      this.visibleCalendarIds = [...this.visibleCalendarIds, calendarId]
    },
    isCalendarVisible(calendarId) {
      return this.visibleCalendarIds.includes(calendarId)
    },
    toggleGroup(groupId) {
      const calendars = this.reservations.calendars.filter((calendar) => calendar.group_id === groupId)
      if (!calendars.length) {
        return
      }

      const ids = calendars.map((calendar) => calendar.id)
      const allVisible = ids.every((id) => this.isCalendarVisible(id))
      if (allVisible) {
        this.visibleCalendarIds = this.visibleCalendarIds.filter((id) => !ids.includes(id))
        return
      }

      const next = new Set(this.visibleCalendarIds)
      ids.forEach((id) => next.add(id))
      this.visibleCalendarIds = this.reservations.calendars.map((calendar) => calendar.id).filter((id) => next.has(id))
    },
    isGroupVisible(groupId) {
      const ids = this.reservations.calendars.filter((calendar) => calendar.group_id === groupId).map((calendar) => calendar.id)
      return ids.length > 0 && ids.every((id) => this.isCalendarVisible(id))
    },
    reservationCount(calendarId) {
      return this.reservations.reservations.filter((item) => item.calendar_id === calendarId).length
    },
    groupReservationCount(groupId) {
      return this.reservations.reservations.filter((item) => item.calendar_group_id === groupId).length
    },
    handleCalendarDayClick(payload) {
      this.openReservationDialog({ date: payload?.scope?.timestamp?.date })
    },
    openReservationDialog({ date = null, calendarId = null } = {}) {
      const selectedDate = date || this.viewDate || todayDate()
      this.reservationForm = {
        calendar_id: calendarId || this.defaultCalendarId,
        all_day: true,
        start_date: selectedDate,
        end_date: selectedDate,
        start_time: '08:00',
        end_time: '09:00',
        details: '',
      }
      this.showReservationDialog = true
    },
    async saveCalendar() {
      try {
        const calendar = this.editingCalendarId
          ? await this.reservations.updateCalendar({ id: this.editingCalendarId, ...this.calendarForm })
          : await this.reservations.createCalendar(this.calendarForm)
        this.visibleCalendarIds = [...this.visibleCalendarIds, calendar.id]
        this.calendarForm = {
          name: '',
          group_id: null,
          description: '',
          color: '#235fa4',
          allow_overlap: false,
        }
        this.editingCalendarId = null
        this.showCalendarDialog = false
        Notify.create({ type: 'positive', message: this.$t('reservations.calendarCreated') })
        await this.loadOverview()
      } catch {
        Notify.create({ type: 'negative', message: this.$t('reservations.calendarCreateFailed') })
      }
    },
    openNewCalendarDialog() {
      this.editingCalendarId = null
      this.calendarForm = {
        name: '',
        group_id: null,
        description: '',
        color: '#235fa4',
        allow_overlap: false,
      }
      this.showCalendarDialog = true
    },
    openCalendarEditor(calendar) {
      this.editingCalendarId = calendar.id
      this.calendarForm = {
        name: calendar.name || '',
        group_id: calendar.group_id ?? null,
        description: calendar.description || '',
        color: calendar.color || '#235fa4',
        allow_overlap: Boolean(calendar.allow_overlap),
      }
      this.showCalendarDialog = true
    },
    openNewGroupDialog() {
      this.editingGroupId = null
      this.groupForm = {
        name: '',
        description: '',
        calendar_ids: [],
      }
      this.showGroupDialog = true
    },
    openGroupEditor(group) {
      this.editingGroupId = group.id
      this.groupForm = {
        name: group.name || '',
        description: group.description || '',
        calendar_ids: Array.isArray(group.calendar_ids) ? [...group.calendar_ids] : [],
      }
      this.showGroupDialog = true
    },
    async saveGroup() {
      try {
        const group = this.editingGroupId
          ? await this.reservations.updateGroup({ id: this.editingGroupId, ...this.groupForm })
          : await this.reservations.createGroup(this.groupForm)
        this.groupForm = {
          name: '',
          description: '',
          calendar_ids: [],
        }
        this.editingGroupId = null
        this.expandedGroups = {
          ...this.expandedGroups,
          [group.id]: true,
        }
        this.showGroupDialog = false
        Notify.create({ type: 'positive', message: this.$t('reservations.groupCreated') })
        await this.loadOverview()
      } catch {
        Notify.create({ type: 'negative', message: this.$t('reservations.groupCreateFailed') })
      }
    },
    async saveReservation() {
      try {
        await this.reservations.createReservation({
          calendar_id: this.reservationForm.calendar_id,
          all_day: this.reservationForm.all_day,
          starts_at: this.reservationForm.all_day
            ? this.reservationForm.start_date
            : `${this.reservationForm.start_date} ${this.reservationForm.start_time}`,
          ends_at: this.reservationForm.all_day
            ? this.reservationForm.end_date
            : `${this.reservationForm.end_date} ${this.reservationForm.end_time}`,
          details: this.reservationForm.details,
        })
        this.showReservationDialog = false
        Notify.create({ type: 'positive', message: this.$t('reservations.reservationCreated') })
      } catch (error) {
        Notify.create({
          type: 'negative',
          message:
            error?.response?.status === 409
              ? this.$t('reservations.reservationConflict')
              : this.$t('reservations.reservationCreateFailed'),
        })
      }
    },
    eventsForDate(date) {
      return this.reservations.reservations.filter((item) => this.isCalendarVisible(item.calendar_id) && this.occursOnDate(item, date))
    },
    visibleEventsForDate(date) {
      return this.eventsForDate(date).slice(0, 4)
    },
    hiddenEventsCount(date) {
      return Math.max(0, this.eventsForDate(date).length - 4)
    },
    occursOnDate(item, date) {
      const dayStart = new Date(`${date}T00:00:00`).getTime()
      const dayEnd = new Date(`${date}T23:59:59`).getTime()
      const start = new Date(String(item.starts_at).replace(' ', 'T')).getTime()
      const end = new Date(String(item.ends_at).replace(' ', 'T')).getTime()

      if (item.all_day) {
        return start <= dayStart && end > dayStart
      }

      return start <= dayEnd && end >= dayStart
    },
    reservationTimeLabel(item) {
      if (item.all_day) {
        return this.$t('reservations.allDayLabel')
      }

      const start = new Date(String(item.starts_at).replace(' ', 'T'))
      const end = new Date(String(item.ends_at).replace(' ', 'T'))
      return this.$t('reservations.timeRange', {
        start: start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        end: end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      })
    },
    reservationDisplayName(item) {
      return item.created_by_name || item.title || this.$t('reservations.unnamedCreator')
    },
    eventChipStyle(item) {
      return {
        '--event-bg': item.calendar_color || '#235FA4',
        '--event-color': item.calendar_text_color || '#ffffff',
      }
    },
    async copyFeed(url) {
      if (!url) {
        return
      }

      try {
        await navigator.clipboard.writeText(url)
        Notify.create({ type: 'positive', message: this.$t('reservations.feedCopied') })
      } catch {
        Notify.create({ type: 'negative', message: this.$t('reservations.feedCopyFailed') })
      }
    },
    copyAllFeed() {
      this.copyFeed(this.allFeedUrl)
    },
  },
})
</script>

<style scoped lang="scss">
.reservations-page {
  padding-bottom: 24px;
}

.reservations-header-actions,
.sidebar-actions,
.sidebar-feed-actions,
.calendar-toolbar,
.calendar-toolbar-group,
.sidebar-feed-row,
.calendar-toggle-name,
.calendar-group-header {
  display: flex;
  align-items: center;
}

.reservations-header-actions,
.sidebar-actions,
.sidebar-feed-actions,
.calendar-toolbar-group {
  gap: 12px;
}

.sidebar-actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.sidebar-action-btn {
  min-height: 38px;
  align-items: center;
  justify-content: center;
}

.reservations-shell {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 24px;
  min-height: calc(100vh - 220px);
}

.reservations-sidebar-card,
.reservations-calendar-card {
  height: 100%;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--app-surface) 94%, white 6%) 0%, var(--app-surface) 100%);
  box-shadow: 0 18px 40px var(--app-shadow);
}

.reservations-sidebar {
  min-width: 0;
}

.reservations-sidebar-list {
  max-height: calc(100vh - 420px);
  overflow: auto;
}

.sidebar-section-title {
  font-weight: 700;
}

.sidebar-hint,
.sidebar-empty {
  font-size: 0.875rem;
  color: var(--app-muted);
}

.sidebar-feed-row {
  justify-content: space-between;
  gap: 12px;
}

.calendar-group-item {
  background: transparent;
}

.calendar-group-item :deep(.q-expansion-item__container) {
  overflow: hidden;
}

.calendar-group-item :deep(.q-expansion-item__toggle-icon) {
  margin-left: 0;
  margin-right: 0;
}

.calendar-group-item :deep(.q-item__section--side) {
  padding-right: 0;
}

.calendar-group-item :deep(.q-item__section--avatar),
.calendar-group-item :deep(.q-item__section--thumbnail),
.calendar-group-item :deep(.q-item__section--side > .q-icon) {
  min-width: auto;
}

.calendar-group-item :deep(.q-item) {
  min-height: 30px;
  padding: 2px 0;
}

:deep(.calendar-group-header) {
  background:
    linear-gradient(90deg, color-mix(in srgb, var(--app-bg-elevated) 94%, var(--app-surface)) 0%, color-mix(in srgb, var(--app-bg-elevated) 82%, var(--app-surface)) 100%);
  border-bottom: 1px solid color-mix(in srgb, var(--app-border) 72%, transparent);
}

.calendar-group-name {
  font-weight: 700;
  font-size: 0.87rem;
}

.calendar-group-children {
  background: transparent;
  margin-left: 16px;
  padding-left: 6px;
}

.calendar-toggle-item {
  min-height: 30px;
  padding: 2px 0;
}

.calendar-toggle-item-child {
  padding-left: 12px;
}

.calendar-toggle-name {
  gap: 8px;
  font-weight: 600;
  font-size: 0.84rem;
}

.calendar-swatch {
  width: 12px;
  height: 12px;
  border-radius: 999px;
  flex: none;
}

.calendar-item-actions {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0;
  white-space: nowrap;
}

.calendar-toggle-item :deep(.q-item__label--caption),
.calendar-group-item :deep(.q-item__label--caption) {
  font-size: 0.66rem;
  line-height: 1.2;
}

.calendar-item-actions :deep(.q-btn) {
  min-width: 24px;
  width: 24px;
  height: 24px;
}

.calendar-toolbar {
  justify-content: space-between;
  gap: 16px;
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--app-primary) 10%, var(--app-surface)) 0%, var(--app-surface) 68%);
}

.calendar-toolbar-center {
  min-width: 0;
  text-align: center;
}

.calendar-title {
  font-family: var(--font-display);
  font-size: 1.35rem;
  text-transform: capitalize;
}

.calendar-subtitle {
  font-size: 0.9rem;
  color: var(--app-muted);
}

.reservations-calendar-wrap {
  padding: 0;
}

.calendar-day-content {
  position: relative;
  height: 100%;
  min-height: 96px;
  padding: 8px 4px 2px;
}

.calendar-day-add {
  position: absolute;
  top: 4px;
  left: 4px;
  width: 24px;
  height: 24px;
  border: 0;
  border-radius: 999px;
  background: color-mix(in srgb, var(--app-primary) 16%, transparent);
  color: var(--app-primary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.calendar-day-events {
  display: grid;
  gap: 4px;
  margin-top: 18px;
}

.calendar-event-chip {
  width: 100%;
  border: 0;
  border-radius: 10px;
  padding: 6px 8px;
  text-align: left;
  background: var(--event-bg);
  color: var(--event-color);
  cursor: default;
  box-shadow: 0 10px 18px rgba(0, 0, 0, 0.1);
}

.calendar-event-time,
.calendar-more-events {
  font-size: 0.75rem;
}

.calendar-event-time {
  display: block;
  opacity: 0.78;
}

.calendar-event-title {
  display: block;
  font-size: 0.82rem;
  font-weight: 700;
  line-height: 1.2;
}

.calendar-event-meta {
  display: block;
  margin-top: 2px;
  font-size: 0.72rem;
  opacity: 0.82;
}

.calendar-more-events {
  color: var(--app-muted);
}

.reservation-dialog-card {
  width: min(720px, 92vw);
}

.reservation-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.color-field {
  display: grid;
  gap: 8px;
}

.color-field-label {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--app-muted);
}

.color-swatch-picker {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  width: fit-content;
  padding: 8px 12px;
  border: 1px solid var(--app-border);
  border-radius: 999px;
  background: color-mix(in srgb, var(--app-surface) 90%, transparent);
  cursor: pointer;
}

.color-swatch-input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.color-swatch-preview {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  border: 2px solid color-mix(in srgb, #ffffff 70%, var(--app-border));
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--app-border) 78%, transparent);
}

.color-swatch-value {
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.04em;
}

:deep(.q-calendar-month__day--content) {
  height: calc(100% - 34px);
}

:deep(.q-calendar-month) {
  --q-calendar-border-color: var(--app-border);
  --q-calendar-background: var(--app-surface);
  --q-calendar-dark: var(--app-surface);
  --q-calendar-dark-page: var(--app-bg-elevated);
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--app-surface-strong) 80%, transparent) 0%, var(--app-surface) 100%);
  border-radius: 0 0 22px 22px;
  overflow: hidden;
}

:deep(.q-calendar-month__head),
:deep(.q-calendar-month__head--weekdays),
:deep(.q-calendar-month__week),
:deep(.q-calendar-month__week--days),
:deep(.q-calendar-month__week--events),
:deep(.q-calendar-month__day),
:deep(.q-calendar-month__workweek) {
  border-color: var(--app-border) !important;
}

:deep(.q-calendar-month__day) {
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--app-surface) 96%, transparent) 0%, color-mix(in srgb, var(--app-surface-strong) 30%, transparent) 100%);
  transition: background-color 160ms ease, box-shadow 160ms ease;
}

:deep(.q-calendar-month__head--weekday),
:deep(.q-calendar-month__day--label) {
  color: var(--app-text);
}

:deep(.q-calendar-month__head--weekday) {
  background: color-mix(in srgb, var(--app-bg-elevated) 78%, var(--app-surface));
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

:deep(.q-calendar-month__day:hover) {
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--app-primary) 8%, var(--app-surface)) 0%, color-mix(in srgb, var(--app-surface-strong) 56%, transparent) 100%);
}

:deep(.q-calendar-month__day.q-active-date) {
  box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--app-primary) 52%, transparent);
}

:deep(.q-calendar-month__day--label) {
  width: 30px;
  height: 30px;
  margin: 4px 4px 0 auto;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--app-bg-elevated) 88%, transparent);
}

:deep(.q-calendar-month__day--label:hover) {
  background: color-mix(in srgb, var(--app-primary) 18%, var(--app-bg-elevated));
}

:deep(.q-calendar-month__day--label__wrapper) {
  padding-right: 2px;
}

:deep(.q-calendar-month__day.disabled) {
  background: color-mix(in srgb, var(--app-bg-elevated) 55%, var(--app-surface));
  opacity: 0.72;
}

:deep(.q-calendar-month__day--outside) {
  color: var(--app-muted);
}

.body--dark :deep(.reservations-sidebar-card),
.body--dark :deep(.reservations-calendar-card) {
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--app-surface) 94%, #0a1220 6%) 0%, var(--app-surface) 100%);
}

@media (max-width: 1100px) {
  .reservations-shell {
    grid-template-columns: 1fr;
  }

  .reservations-sidebar-list {
    max-height: none;
  }
}

@media (max-width: 700px) {
  .reservation-form-grid {
    grid-template-columns: 1fr;
  }

  .calendar-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .reservations-header-actions {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }
}
</style>
