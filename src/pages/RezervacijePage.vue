<template>
  <q-page class="page-wrap reservations-page">
    <section class="content-header">
      <div class="content-header-row">
        <div>
          <h1 class="page-title">{{ $t('reservations.title') }}</h1>
          <p class="page-lead">{{ $t('reservations.lead') }}</p>
        </div>
        <div class="reservations-header-actions">
          <q-btn flat no-caps color="primary" icon="link" :label="isMobile ? '' : $t('reservations.copyFeed')" @click="copyAllFeed">
            <q-tooltip>{{ $t('reservations.copyFeed') }}</q-tooltip>
          </q-btn>
          <q-btn unelevated color="primary" icon="event_available" :label="isMobile ? '' : $t('reservations.addReservation')" @click="openReservationDialog()">
            <q-tooltip>{{ $t('reservations.addReservation') }}</q-tooltip>
          </q-btn>
        </div>
      </div>
    </section>

    <div class="reservations-shell">
      <aside class="reservations-sidebar">
        <q-card flat bordered class="panel-card reservations-sidebar-card">
          <q-card-section class="q-gutter-sm">
            <div class="panel-title">{{ $t('reservations.sidebarTitle') }}</div>
            <div class="sidebar-actions">
              <q-btn class="sidebar-action-btn" stack unelevated color="primary" icon="add" :label="$t('reservations.addCalendar')" @click="openNewCalendarDialog" />
              <q-btn class="sidebar-action-btn" stack flat no-caps color="primary" icon="create_new_folder" :label="$t('reservations.addGroup')" @click="openNewGroupDialog" />
              <q-btn class="sidebar-action-btn" stack flat no-caps color="primary" icon="event" :label="$t('reservations.addReservation')" @click="openReservationDialog()" />
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
                <q-btn flat dense round icon="content_copy" @click="copyAllFeed">
                  <q-tooltip>{{ $t('reservations.copyFeed') }}</q-tooltip>
                </q-btn>
                <q-btn
                  v-if="allFeedUrl"
                  flat
                  dense
                  round
                  icon="open_in_new"
                  type="a"
                  :href="allFeedUrl"
                  target="_blank"
                >
                  <q-tooltip>{{ $t('reservations.openFeed') }}</q-tooltip>
                </q-btn>
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
                      <q-btn flat dense round size="sm" icon="edit" :title="$t('reservations.editGroup')" @click.stop="openGroupEditor(entry.group)">
                        <q-tooltip>{{ $t('reservations.editGroup') }}</q-tooltip>
                      </q-btn>
                      <q-btn flat dense round icon="content_copy" :title="$t('reservations.copyFeed')" @click.stop="copyFeed(entry.group.feed_url)">
                        <q-tooltip>{{ $t('reservations.copyFeed') }}</q-tooltip>
                      </q-btn>
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
                        <q-btn flat dense round size="sm" icon="edit" :title="$t('reservations.editCalendar')" @click.stop="openCalendarEditor(calendar)">
                          <q-tooltip>{{ $t('reservations.editCalendar') }}</q-tooltip>
                        </q-btn>
                        <q-btn flat dense round size="sm" icon="add" :title="$t('reservations.addForCalendar')" @click.stop="openReservationDialog({ calendarId: calendar.id })">
                          <q-tooltip>{{ $t('reservations.addForCalendar') }}</q-tooltip>
                        </q-btn>
                        <q-btn flat dense round size="sm" icon="content_copy" :title="$t('reservations.copyFeed')" @click.stop="copyFeed(calendar.feed_url)">
                          <q-tooltip>{{ $t('reservations.copyFeed') }}</q-tooltip>
                        </q-btn>
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
                    <q-btn flat dense round size="sm" icon="edit" :title="$t('reservations.editCalendar')" @click.stop="openCalendarEditor(entry.calendar)">
                      <q-tooltip>{{ $t('reservations.editCalendar') }}</q-tooltip>
                    </q-btn>
                    <q-btn flat dense round size="sm" icon="add" :title="$t('reservations.addForCalendar')" @click.stop="openReservationDialog({ calendarId: entry.calendar.id })">
                      <q-tooltip>{{ $t('reservations.addForCalendar') }}</q-tooltip>
                    </q-btn>
                    <q-btn flat dense round size="sm" icon="content_copy" :title="$t('reservations.copyFeed')" @click.stop="copyFeed(entry.calendar.feed_url)">
                      <q-tooltip>{{ $t('reservations.copyFeed') }}</q-tooltip>
                    </q-btn>
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
              <q-btn flat round icon="chevron_left" @click="moveCalendar(-1)">
                <q-tooltip>{{ $t('reservations.previousPeriod') }}</q-tooltip>
              </q-btn>
              <q-btn flat no-caps color="primary" :label="$t('reservations.today')" @click="moveToToday" />
              <q-btn flat round icon="chevron_right" @click="moveCalendar(1)">
                <q-tooltip>{{ $t('reservations.nextPeriod') }}</q-tooltip>
              </q-btn>
            </div>
            <div class="calendar-toolbar-center">
              <div class="calendar-title">{{ monthLabel }}</div>
              <div class="calendar-subtitle">{{ calendarSubtitle }}</div>
            </div>
            <div class="calendar-toolbar-group calendar-view-switch">
              <q-btn flat no-caps color="primary" icon="print" :label="isMobile ? '' : $t('reservations.print')" @click="printMonthCalendar">
                <q-tooltip>{{ $t('reservations.print') }}</q-tooltip>
              </q-btn>
              <q-btn-toggle
                v-model="viewMode"
                unelevated
                no-caps
                class="calendar-mode-toggle"
                toggle-color="primary"
                :options="viewOptions"
                @update:model-value="persistViewMode"
              />
            </div>
          </q-card-section>

          <q-separator />

          <q-card-section class="reservations-calendar-wrap">
            <q-calendar-month
              v-if="viewMode === 'month'"
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
                      @click.stop="openReservationEditor(event)"
                    >
                      <span class="calendar-event-time">{{ reservationTimeLabel(event) }}</span>
                      <span class="calendar-event-title">{{ reservationPrimaryLabel(event) }}</span>
                      <span v-if="reservationDetailsLabel(event)" class="calendar-event-meta">
                        {{ reservationDetailsLabel(event) }}
                      </span>
                      <span class="calendar-event-submeta">{{ reservationReserverLabel(event) }}</span>
                      <q-tooltip class="bg-dark text-white">
                        <div>{{ reservationPrimaryLabel(event) }}</div>
                        <div>{{ reservationTimeLabel(event) }}</div>
                        <div v-if="reservationDetailsLabel(event)">{{ reservationDetailsLabel(event) }}</div>
                        <div>{{ reservationReserverLabel(event) }}</div>
                      </q-tooltip>
                    </button>
                  </div>
                </div>
              </template>
            </q-calendar-month>

            <div v-else-if="viewMode === 'week' && isMobile" class="mobile-week-stack">
              <q-calendar-day
                v-for="date in weekDates"
                :key="`mobile-week-${date}`"
                :model-value="date"
                :locale="$i18n.locale"
                bordered
                date-align="right"
                weekday-align="center"
                :weekdays="[1, 2, 3, 4, 5, 6, 0]"
                :max-days="1"
                :interval-start="7"
                :interval-minutes="60"
                :interval-count="14"
                :interval-height="40"
                :class="{ 'mobile-week-empty': !eventsForDate(date).length }"
                @click-time="handleCalendarTimeClick"
              >
                <template #day-body="{ scope }">
                  <div v-if="eventsForDate(scope.timestamp.date).length" class="calendar-day-mode-content">
                    <button class="calendar-day-add" type="button" @click.stop="openReservationDialog({ date: scope.timestamp.date })">
                      <q-icon name="add" size="16px" />
                    </button>
                    <div class="calendar-day-events">
                      <button
                        v-for="event in visibleEventsForDate(scope.timestamp.date)"
                        :key="`${scope.timestamp.date}-${event.id}`"
                        type="button"
                        class="calendar-event-chip"
                        :style="eventChipStyle(event)"
                        @click.stop="openReservationEditor(event)"
                      >
                        <span class="calendar-event-time">{{ reservationTimeLabel(event) }}</span>
                        <span class="calendar-event-title">{{ reservationPrimaryLabel(event) }}</span>
                        <span v-if="reservationDetailsLabel(event)" class="calendar-event-meta">
                          {{ reservationDetailsLabel(event) }}
                        </span>
                        <span class="calendar-event-submeta">{{ reservationReserverLabel(event) }}</span>
                      </button>
                    </div>
                  </div>
                </template>
              </q-calendar-day>
            </div>

            <q-calendar-day
              v-else
              ref="calendarDayRef"
              v-model="viewDate"
              :locale="$i18n.locale"
              animated
              bordered
              date-align="right"
              weekday-align="center"
              :weekdays="[1, 2, 3, 4, 5, 6, 0]"
              :max-days="viewMode === 'week' ? 7 : 1"
              :interval-start="7"
              :interval-minutes="60"
              :interval-count="14"
              :interval-height="isMobile ? 42 : 50"
              @click-time="handleCalendarTimeClick"
            >
              <template #day-body="{ scope }">
                <div class="calendar-day-mode-content">
                  <button class="calendar-day-add" type="button" @click.stop="openReservationDialog({ date: scope.timestamp.date })">
                    <q-icon name="add" size="16px" />
                  </button>
                  <div class="calendar-day-events">
                    <button
                      v-for="event in visibleEventsForDate(scope.timestamp.date)"
                      :key="`${scope.timestamp.date}-${event.id}`"
                      type="button"
                      class="calendar-event-chip"
                      :style="eventChipStyle(event)"
                      @click.stop="openReservationEditor(event)"
                    >
                      <span class="calendar-event-time">{{ reservationTimeLabel(event) }}</span>
                      <span class="calendar-event-title">{{ reservationPrimaryLabel(event) }}</span>
                      <span v-if="reservationDetailsLabel(event)" class="calendar-event-meta">
                        {{ reservationDetailsLabel(event) }}
                      </span>
                      <span class="calendar-event-submeta">{{ reservationReserverLabel(event) }}</span>
                    </button>
                  </div>
                </div>
              </template>
            </q-calendar-day>
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

    <q-dialog v-model="showReservationDialog" @hide="resetReservationDialog">
      <q-card class="reservation-dialog-card">
        <q-card-section>
          <div class="panel-title">{{ editingReservationId ? $t('reservations.editReservation') : $t('reservations.addReservation') }}</div>
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
            option-label="label"
            options-dense
            popup-content-class="reservation-calendar-menu"
            :options="reservationCalendarOptions"
            :label="$t('reservations.reservationCalendar')"
          >
            <template #option="scope">
              <q-item
                v-bind="scope.itemProps"
                :class="
                  scope.opt.type === 'group'
                    ? 'reservation-calendar-option reservation-calendar-option-group'
                    : 'reservation-calendar-option reservation-calendar-option-child'
                "
              >
                <q-item-section v-if="scope.opt.type === 'group'">
                  <q-item-label class="reservation-calendar-group-label">
                    {{ scope.opt.label }}
                  </q-item-label>
                </q-item-section>
                <template v-else>
                  <q-item-section avatar class="reservation-calendar-option-swatch-wrap">
                    <span class="calendar-swatch" :style="{ background: scope.opt.color }" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="reservation-calendar-option-label">
                      {{ scope.opt.label }}
                    </q-item-label>
                    <q-item-label v-if="scope.opt.group_name" caption class="reservation-calendar-option-caption">
                      {{ scope.opt.group_name }}
                    </q-item-label>
                  </q-item-section>
                </template>
              </q-item>
            </template>
          </q-select>
          <q-select
            v-model="reservationForm.author_id"
            outlined
            emit-value
            map-options
            use-input
            fill-input
            hide-selected
            input-debounce="0"
            option-value="id"
            option-label="label"
            :options="filteredReservationUsers"
            :label="$t('reservations.author')"
            @filter="filterReservationUsers"
            @popup-show="resetReservationUserOptions"
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
          <q-toggle v-model="reservationForm.all_day" :label="$t('reservations.allDay')" />
          <div class="reservation-form-grid">
            <q-input v-model="reservationForm.start_date" outlined mask="####-##-##" :label="$t('reservations.startDate')">
              <template #append>
                <q-icon name="event" class="cursor-pointer" @click.stop="showReservationPopup('startDatePopup')">
                  <q-popup-proxy ref="startDatePopup" no-parent-event cover transition-show="scale" transition-hide="scale">
                    <q-date v-model="reservationForm.start_date" mask="YYYY-MM-DD" />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
            <q-input v-if="!reservationForm.all_day" v-model="reservationForm.start_time" outlined mask="##:##" :label="$t('reservations.startTime')">
              <template #append>
                <q-icon name="schedule" class="cursor-pointer" @click.stop="showReservationPopup('startTimePopup')">
                  <q-popup-proxy ref="startTimePopup" no-parent-event cover transition-show="scale" transition-hide="scale">
                    <q-time v-model="reservationForm.start_time" mask="HH:mm" format24h />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
            <q-input v-model="reservationForm.end_date" outlined mask="####-##-##" :label="$t('reservations.endDate')">
              <template #append>
                <q-icon name="event" class="cursor-pointer" @click.stop="showReservationPopup('endDatePopup')">
                  <q-popup-proxy ref="endDatePopup" no-parent-event cover transition-show="scale" transition-hide="scale">
                    <q-date v-model="reservationForm.end_date" mask="YYYY-MM-DD" />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
            <q-input v-if="!reservationForm.all_day" v-model="reservationForm.end_time" outlined mask="##:##" :label="$t('reservations.endTime')">
              <template #append>
                <q-icon name="schedule" class="cursor-pointer" @click.stop="showReservationPopup('endTimePopup')">
                  <q-popup-proxy ref="endTimePopup" no-parent-event cover transition-show="scale" transition-hide="scale">
                    <q-time v-model="reservationForm.end_time" mask="HH:mm" format24h />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>
          <q-input v-model="reservationForm.details" outlined type="textarea" autogrow :label="$t('reservations.reservationDetails')" />
        </q-card-section>
        <q-card-actions>
          <q-btn v-if="editingReservationId" flat no-caps color="negative" :label="$t('reservations.deleteReservation')" :loading="reservations.savingReservation" @click="confirmDeleteReservation" />
          <q-space />
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

    <q-dialog v-model="showDeleteReservationDialog">
      <q-card class="reservation-dialog-card">
        <q-card-section>
          <div class="panel-title">{{ $t('reservations.deleteReservation') }}</div>
        </q-card-section>
        <q-card-section>
          {{ $t('reservations.deleteConfirm', { name: reservationDeleteLabel }) }}
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat no-caps color="primary" :label="$t('reservations.cancel')" v-close-popup />
          <q-btn unelevated color="negative" :label="$t('reservations.deleteReservation')" :loading="reservations.savingReservation" @click="deleteReservation" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { defineComponent } from 'vue'
import { Notify } from 'quasar'
import { QCalendarDay, QCalendarMonth } from '@quasar/quasar-ui-qcalendar'
import { api } from 'boot/axios'
import { useAuthStore } from 'stores/auth-store'
import { useReservationsStore } from 'stores/reservations-store'
import { AUTO_REFRESH_INTERVAL_MS, buildSnapshot } from 'src/utils/auto-refresh'

const VISIBLE_CALENDAR_STORAGE_KEY = 'izrk.reservations.visible-calendars'

function todayDate() {
  return formatLocalDate(new Date())
}

function padDatePart(value) {
  return String(value).padStart(2, '0')
}

function formatLocalDate(date) {
  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`
}

function formatLocalDateTime(date) {
  return `${formatLocalDate(date)} ${padDatePart(date.getHours())}:${padDatePart(date.getMinutes())}:${padDatePart(date.getSeconds())}`
}

function parseCalendarDate(dateString) {
  return new Date(`${dateString}T12:00:00`)
}

function shiftDate(dateString, amount) {
  const date = parseCalendarDate(dateString)
  date.setDate(date.getDate() + amount)
  return formatLocalDate(date)
}

function shiftMonth(dateString, amount) {
  const date = parseCalendarDate(dateString)
  date.setMonth(date.getMonth() + amount)
  return formatLocalDate(date)
}

function startOfWeek(dateString) {
  const date = parseCalendarDate(dateString)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  return formatLocalDate(date)
}

function monthRange(dateString) {
  const date = parseCalendarDate(dateString)
  const start = new Date(date.getFullYear(), date.getMonth(), 1)
  const end = new Date(date.getFullYear(), date.getMonth() + 2, 0, 23, 59, 59)

  return {
    start: formatLocalDateTime(start),
    end: formatLocalDateTime(end),
  }
}

function normalizeReservationUser(user) {
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

function reservationDatePart(value) {
  return String(value || '').slice(0, 10)
}

function reservationTimePart(value) {
  return String(value || '').slice(11, 16)
}

function inclusiveAllDayEndDate(value) {
  const date = reservationDatePart(value)
  return date ? shiftDate(date, -1) : todayDate()
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[character]
  })
}

function sanitizeCssColor(value, fallback) {
  const normalized = String(value || '').trim()
  return /^#([0-9a-f]{3,8})$/i.test(normalized) ? normalized : fallback
}

export default defineComponent({
  name: 'RezervacijePage',
  components: {
    QCalendarDay,
    QCalendarMonth,
  },
  data() {
    const date = todayDate()

    return {
      auth: useAuthStore(),
      reservations: useReservationsStore(),
      reservationUsers: [],
      filteredReservationUsers: [],
      viewDate: date,
      viewMode: 'month',
      visibleCalendarIds: [],
      visibleCalendarSelectionLoaded: false,
      expandedGroups: {},
      showCalendarDialog: false,
      showGroupDialog: false,
      showReservationDialog: false,
      showDeleteReservationDialog: false,
      editingCalendarId: null,
      editingGroupId: null,
      editingReservationId: null,
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
        author_id: null,
        all_day: true,
        start_date: date,
        end_date: date,
        start_time: '08:00',
        end_time: '09:00',
        details: '',
      },
      autoRefreshTimer: null,
      autoRefreshPending: false,
    }
  },
  computed: {
    allFeedUrl() {
      return this.reservations.feeds?.all?.url || ''
    },
    isMobile() {
      return this.$q.screen.lt.md
    },
    viewOptions() {
      return [
        { label: this.$t('reservations.viewWeek'), value: 'week' },
        { label: this.$t('reservations.viewMonth'), value: 'month' },
        { label: this.$t('reservations.viewDay'), value: 'day' },
      ]
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
    reservationCalendarOptions() {
      const grouped = this.groupedCalendars.flatMap((entry) => [
        {
          id: `group-${entry.group.id}`,
          label: entry.group.name,
          type: 'group',
          disable: true,
        },
        ...entry.calendars.map((calendar) => ({
          ...calendar,
          label: calendar.name,
          type: 'calendar',
          group_name: entry.group.name,
        })),
      ])

      const singles = this.ungroupedCalendars.map((calendar) => ({
        ...calendar,
        label: calendar.name,
        type: 'calendar',
        group_name: null,
      }))

      return [...grouped, ...singles]
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
      if (this.viewMode === 'week') {
        const first = this.weekDates[0]
        return this.formatWeekMonth(first)
      }

      if (this.viewMode === 'day') {
        return this.formatAgendaDate(this.viewDate)
      }

      return new Intl.DateTimeFormat(this.$i18n.locale, {
        month: 'long',
        year: 'numeric',
      }).format(new Date(`${this.viewDate}T00:00:00`))
    },
    calendarSubtitle() {
      if (this.viewMode === 'week') {
        const first = this.weekDates[0]
        const last = this.weekDates[this.weekDates.length - 1]
        return `${this.formatShortDate(first)} - ${this.formatShortDate(last)}`
      }

      return this.visibleCalendarSummary
    },
    visibleCalendarSummary() {
      return `${this.visibleCalendarIds.length}/${this.reservations.calendars.length} ${this.$t('reservations.allVisible')}`
    },
    defaultCalendarId() {
      return this.visibleCalendarIds[0] || this.reservations.calendars[0]?.id || null
    },
    reservationDeleteLabel() {
      const reservation = this.currentEditedReservation()
      return reservation ? this.reservationPrimaryLabel(reservation) : ''
    },
    weekDates() {
      const date = parseCalendarDate(this.viewDate)
      const day = date.getDay()
      const diff = day === 0 ? -6 : 1 - day
      date.setDate(date.getDate() + diff)
      return Array.from({ length: 7 }, (_, index) => {
        return shiftDate(formatLocalDate(date), index)
      })
    },
  },
  async mounted() {
    this.loadViewMode()
    this.visibleCalendarSelectionLoaded = this.loadVisibleCalendarIds()
    await Promise.all([this.loadOverview(), this.loadReservationUsers()])
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
        !this.showCalendarDialog &&
        !this.showGroupDialog &&
        !this.showReservationDialog &&
        !this.showDeleteReservationDialog &&
        !this.autoRefreshPending &&
        !this.reservations.loading &&
        !this.reservations.savingCalendar &&
        !this.reservations.savingGroup &&
        !this.reservations.savingReservation
      )
    },
    createAutoRefreshSnapshot() {
      return buildSnapshot({
        groups: this.reservations.groups,
        calendars: this.reservations.calendars,
        reservations: this.reservations.reservations,
        feeds: this.reservations.feeds,
        range: this.reservations.range,
      })
    },
    async runAutoRefresh() {
      if (!this.shouldAutoRefresh()) {
        return
      }

      const previousSnapshot = this.createAutoRefreshSnapshot()
      this.autoRefreshPending = true

      try {
        await this.loadOverview({ silent: true })
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
    loadViewMode() {
      const key = this.isMobile ? 'izrk.reservations.view.mobile' : 'izrk.reservations.view.desktop'
      const stored = window.localStorage.getItem(key)
      this.viewMode = stored || (this.isMobile ? 'week' : 'month')
      this.viewDate = this.normalizeViewDate(this.viewMode, this.viewDate)
    },
    persistViewMode(value) {
      const key = this.isMobile ? 'izrk.reservations.view.mobile' : 'izrk.reservations.view.desktop'
      this.viewMode = value
      this.viewDate = this.normalizeViewDate(value, this.viewDate)
      window.localStorage.setItem(key, value)
    },
    normalizeVisibleCalendarIds(ids) {
      return [...new Set((Array.isArray(ids) ? ids : []).map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0))]
    },
    loadVisibleCalendarIds() {
      const stored = window.localStorage.getItem(VISIBLE_CALENDAR_STORAGE_KEY)
      if (!stored) {
        return false
      }

      try {
        const parsed = JSON.parse(stored)
        if (!Array.isArray(parsed)) {
          return false
        }

        this.visibleCalendarIds = this.normalizeVisibleCalendarIds(parsed)
        return true
      } catch {
        return false
      }
    },
    setVisibleCalendarIds(ids) {
      const normalized = this.normalizeVisibleCalendarIds(ids)
      this.visibleCalendarIds = normalized
      window.localStorage.setItem(VISIBLE_CALENDAR_STORAGE_KEY, JSON.stringify(normalized))
    },
    async loadOverview({ silent = false } = {}) {
      try {
        const range = monthRange(this.viewDate)
        await this.reservations.loadOverview(range)
        this.syncVisibleCalendars()
        this.syncExpandedGroups()
      } catch {
        if (!silent) {
          Notify.create({ type: 'negative', message: this.$t('reservations.loadFailed') })
        }
      }
    },
    async loadReservationUsers() {
      try {
        const { data } = await api.get('reservations/users')
        this.reservationUsers = (data.users || []).map(normalizeReservationUser)
        this.resetReservationUserOptions()
      } catch {
        Notify.create({ type: 'negative', message: this.$t('reservations.usersLoadFailed') })
      }
    },
    filterReservationUsers(value, update) {
      update(() => {
        const needle = String(value || '').trim().toLowerCase()
        this.filteredReservationUsers = !needle
          ? [...this.reservationUsers]
          : this.reservationUsers.filter((user) => user.search_text.includes(needle))
      })
    },
    resetReservationUserOptions() {
      this.filteredReservationUsers = [...this.reservationUsers]
    },
    buildReservationForm({ date = null, calendarId = null, reservation = null } = {}) {
      if (reservation) {
        const startDate = reservationDatePart(reservation.starts_at) || todayDate()
        return {
          calendar_id: reservation.calendar_id || this.defaultCalendarId,
          author_id: reservation.author_id ?? reservation.created_by ?? this.auth.user?.id ?? null,
          all_day: Boolean(reservation.all_day),
          start_date: startDate,
          end_date: reservation.all_day ? inclusiveAllDayEndDate(reservation.ends_at) : reservationDatePart(reservation.ends_at) || startDate,
          start_time: reservationTimePart(reservation.starts_at) || '08:00',
          end_time: reservationTimePart(reservation.ends_at) || '09:00',
          details: reservation.details || '',
        }
      }

      const selectedDate = date || this.viewDate || todayDate()
      return {
        calendar_id: calendarId || this.defaultCalendarId,
        author_id: this.auth.user?.id || null,
        all_day: true,
        start_date: selectedDate,
        end_date: selectedDate,
        start_time: '08:00',
        end_time: '09:00',
        details: '',
      }
    },
    syncVisibleCalendars() {
      const ids = this.reservations.calendars.map((calendar) => calendar.id)
      if (!this.visibleCalendarSelectionLoaded) {
        this.visibleCalendarSelectionLoaded = true
        this.setVisibleCalendarIds(ids)
        return
      }

      const current = new Set(this.visibleCalendarIds)
      this.setVisibleCalendarIds(ids.filter((id) => current.has(id)))
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
      if (this.viewMode === 'month') {
        this.viewDate = shiftMonth(this.viewDate, direction)
      } else if (this.viewMode === 'week') {
        this.viewDate = shiftDate(this.viewDate, direction * 7)
      } else {
        this.viewDate = shiftDate(this.viewDate, direction)
      }
      this.loadOverview()
    },
    moveToToday() {
      this.viewDate = this.normalizeViewDate(this.viewMode, todayDate())
      this.loadOverview()
    },
    printMonthCalendar() {
      const iframe = document.createElement('iframe')
      iframe.setAttribute('aria-hidden', 'true')
      iframe.style.position = 'fixed'
      iframe.style.right = '0'
      iframe.style.bottom = '0'
      iframe.style.width = '0'
      iframe.style.height = '0'
      iframe.style.border = '0'

      document.body.appendChild(iframe)

      const printWindow = iframe.contentWindow
      const printDocument = printWindow?.document

      if (!printWindow || !printDocument) {
        iframe.remove()
        Notify.create({ type: 'negative', message: 'Print view could not be created.' })
        return
      }

      const cleanup = () => {
        window.setTimeout(() => {
          iframe.remove()
        }, 0)
      }

      printWindow.addEventListener('afterprint', cleanup, { once: true })

      printDocument.open()
      printDocument.write(this.buildPrintDocument())
      printDocument.close()

      window.setTimeout(() => {
        printWindow.focus()
        printWindow.print()
      }, 150)
    },
    buildPrintDocument() {
      const title = this.formatPrintMonthLabel(this.viewDate)
      const weekdayLabels = this.printWeekdayLabels()
      const weeks = this.buildPrintMonthWeeks(this.viewDate)
      const rowHeights = weeks.map((week) => `${week.weight}fr`).join(' ')

      const weekdayMarkup = weekdayLabels.map((label) => `<div class="weekday">${escapeHtml(label)}</div>`).join('')
      const weekMarkup = weeks.map((week) => {
        const dayMarkup = week.map((day) => {
          const eventMarkup = day.events.map((event) => {
            return `
              <div class="event" style="background:${event.background};color:${event.color};">
                <div class="event-time">${escapeHtml(event.time)}</div>
                <div class="event-title">${escapeHtml(event.title)}</div>
                ${event.meta ? `<div class="event-meta">${escapeHtml(event.meta)}</div>` : ''}
              </div>
            `
          }).join('')

          return `
            <div class="day${day.outside ? ' outside' : ''}">
              <div class="day-number">${escapeHtml(day.label)}</div>
              <div class="events">
                ${eventMarkup}
                ${day.hiddenCount > 0 ? `<div class="more">${escapeHtml(this.$t('reservations.hiddenMore', { count: day.hiddenCount }))}</div>` : ''}
              </div>
            </div>
          `
        }).join('')

        return `<div class="week">${dayMarkup}</div>`
      }).join('')

      return `
        <!doctype html>
        <html lang="${escapeHtml(this.$i18n.locale)}">
          <head>
            <meta charset="utf-8" />
            <title>${escapeHtml(title)}</title>
            <style>
              @page {
                size: landscape;
                margin: 16mm;
              }

              html,
              body {
                margin: 0;
                padding: 0;
                background: #fff;
                color: #111827;
                font-family: "Source Sans 3", "Segoe UI", Arial, sans-serif;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }

              body {
                padding: 4mm;
                box-sizing: border-box;
              }

              .sheet {
                width: calc(100% - 8mm);
                margin: 0 auto;
                padding: 0 4mm 4mm;
                box-sizing: border-box;
              }

              .title {
                margin: 0 0 5mm;
                text-align: center;
                font-family: "Playfair Display", Georgia, serif;
                font-size: 17pt;
                font-weight: 700;
              }

              .calendar {
                display: grid;
                grid-template-rows: auto ${rowHeights};
                height: 154mm;
                border: 1px solid #d9dee7;
                page-break-inside: avoid;
                break-inside: avoid;
              }

              .weekdays,
              .week {
                display: grid;
                grid-template-columns: repeat(7, minmax(0, 1fr));
              }

              .week {
                min-height: 0;
              }

              .weekday,
              .day {
                min-width: 0;
                border-right: 1px solid #e5e7eb;
              }

              .weekday:last-child,
              .day:last-child {
                border-right: 0;
              }

              .weekday {
                padding: 2mm 1.5mm;
                border-bottom: 1px solid #d9dee7;
                text-align: center;
                font-size: 8pt;
                font-weight: 700;
                color: #334155;
              }

              .week + .week .day {
                border-top: 1px solid #e5e7eb;
              }

              .day {
                padding: 1.5mm;
                overflow: hidden;
                display: flex;
                flex-direction: column;
                gap: 1mm;
                min-height: 0;
                box-sizing: border-box;
              }

              .day.outside .day-number {
                color: #94a3b8;
              }

              .day-number {
                align-self: flex-end;
                font-size: 7pt;
                font-weight: 600;
                color: #475569;
              }

              .events {
                display: grid;
                gap: 1mm;
                min-height: 0;
                overflow: hidden;
                align-content: start;
              }

              .event {
                border-radius: 3px;
                padding: 1mm 1.2mm;
                overflow: hidden;
                max-width: 100%;
                box-sizing: border-box;
              }

              .event-time,
              .event-meta,
              .more {
                font-size: 5.7pt;
                line-height: 1.1;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
              }

              .event-title {
                font-size: 6.4pt;
                line-height: 1.1;
                font-weight: 700;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
              }

              .event-time {
                opacity: 0.82;
              }

              .event-meta {
                opacity: 0.9;
              }

              .more {
                color: #64748b;
              }
            </style>
          </head>
          <body>
            <div class="sheet">
              <h1 class="title">${escapeHtml(title)}</h1>
              <div class="calendar">
                <div class="weekdays">${weekdayMarkup}</div>
                ${weekMarkup}
              </div>
            </div>
          </body>
        </html>
      `
    },
    buildPrintMonthWeeks(dateString) {
      const monthDate = parseCalendarDate(dateString)
      const monthStart = formatLocalDate(new Date(monthDate.getFullYear(), monthDate.getMonth(), 1))
      const gridStart = startOfWeek(monthStart)

      return Array.from({ length: 6 }, (_, weekIndex) => {
        const days = Array.from({ length: 7 }, (_, dayIndex) => {
          const date = shiftDate(gridStart, weekIndex * 7 + dayIndex)
          const current = parseCalendarDate(date)
          const events = this.eventsForDate(date)
          const visibleEvents = events.map((event) => ({
            time: this.reservationTimeLabel(event),
            title: this.reservationPrimaryLabel(event),
            meta: this.reservationDetailsLabel(event) || this.reservationReserverLabel(event),
            background: sanitizeCssColor(event.calendar_color, '#235FA4'),
            color: sanitizeCssColor(event.calendar_text_color, '#ffffff'),
          }))

          return {
            date,
            label: String(current.getDate()),
            outside: current.getMonth() !== monthDate.getMonth(),
            events: visibleEvents,
            hiddenCount: 0,
          }
        })

        const maxEvents = Math.max(...days.map((day) => day.events.length), 0)
        const hasEvents = maxEvents > 0
        const weight = !hasEvents ? 0.68 : Math.min(1 + maxEvents * 0.34, 3.4)

        return Object.assign(days, {
          weight,
        })
      })
    },
    printWeekdayLabels() {
      const monday = parseCalendarDate('2024-01-01')
      return Array.from({ length: 7 }, (_, index) => {
        const date = new Date(monday)
        date.setDate(monday.getDate() + index)
        return new Intl.DateTimeFormat(this.$i18n.locale, { weekday: 'long' }).format(date)
      })
    },
    formatPrintMonthLabel(dateString) {
      return new Intl.DateTimeFormat(this.$i18n.locale, {
        month: 'long',
        year: 'numeric',
      }).format(new Date(`${dateString}T00:00:00`))
    },
    showReservationPopup(refName) {
      this.$refs[refName]?.show?.()
    },
    normalizeViewDate(mode, date) {
      if (mode === 'week') {
        return startOfWeek(date)
      }

      return date
    },
    toggleCalendar(calendarId) {
      if (this.isCalendarVisible(calendarId)) {
        this.setVisibleCalendarIds(this.visibleCalendarIds.filter((id) => id !== calendarId))
        return
      }

      this.setVisibleCalendarIds([...this.visibleCalendarIds, calendarId])
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
        this.setVisibleCalendarIds(this.visibleCalendarIds.filter((id) => !ids.includes(id)))
        return
      }

      const next = new Set(this.visibleCalendarIds)
      ids.forEach((id) => next.add(id))
      this.setVisibleCalendarIds(this.reservations.calendars.map((calendar) => calendar.id).filter((id) => next.has(id)))
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
    handleCalendarTimeClick(payload) {
      this.openReservationDialog({ date: payload?.scope?.timestamp?.date })
    },
    openReservationDialog({ date = null, calendarId = null } = {}) {
      this.editingReservationId = null
      this.reservationForm = this.buildReservationForm({ date, calendarId })
      this.resetReservationUserOptions()
      this.showReservationDialog = true
    },
    openReservationEditor(reservation) {
      this.editingReservationId = reservation.id
      this.reservationForm = this.buildReservationForm({ reservation })
      this.resetReservationUserOptions()
      this.showReservationDialog = true
    },
    resetReservationDialog() {
      this.editingReservationId = null
      this.showDeleteReservationDialog = false
      this.reservationForm = this.buildReservationForm()
      this.resetReservationUserOptions()
    },
    currentEditedReservation() {
      return this.reservations.reservations.find((item) => item.id === this.editingReservationId) || null
    },
    async saveCalendar() {
      try {
        const calendar = this.editingCalendarId
          ? await this.reservations.updateCalendar({ id: this.editingCalendarId, ...this.calendarForm })
          : await this.reservations.createCalendar(this.calendarForm)
        this.setVisibleCalendarIds([...this.visibleCalendarIds, calendar.id])
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
      const payload = {
        calendar_id: this.reservationForm.calendar_id,
        author_id: this.reservationForm.author_id,
        all_day: this.reservationForm.all_day,
        starts_at: this.reservationForm.all_day
          ? this.reservationForm.start_date
          : `${this.reservationForm.start_date} ${this.reservationForm.start_time}`,
        ends_at: this.reservationForm.all_day
          ? this.reservationForm.end_date
          : `${this.reservationForm.end_date} ${this.reservationForm.end_time}`,
        details: this.reservationForm.details,
      }
      const isEditing = Boolean(this.editingReservationId)

      try {
        if (isEditing) {
          await this.reservations.updateReservation({ id: this.editingReservationId, ...payload })
        } else {
          await this.reservations.createReservation(payload)
        }
        this.showReservationDialog = false
        await this.loadOverview()
        Notify.create({ type: 'positive', message: this.$t(isEditing ? 'reservations.reservationUpdated' : 'reservations.reservationCreated') })
      } catch (error) {
        Notify.create({
          type: 'negative',
          message:
            error?.response?.status === 409
              ? this.$t('reservations.reservationConflict')
              : this.$t(isEditing ? 'reservations.reservationUpdateFailed' : 'reservations.reservationCreateFailed'),
        })
      }
    },
    confirmDeleteReservation() {
      if (!this.currentEditedReservation()) {
        return
      }
      this.showDeleteReservationDialog = true
    },
    async deleteReservation() {
      const reservation = this.currentEditedReservation()
      if (!reservation) {
        return
      }
      try {
        await this.reservations.deleteReservation({ id: reservation.id })
        this.showDeleteReservationDialog = false
        this.showReservationDialog = false
        await this.loadOverview()
        Notify.create({ type: 'positive', message: this.$t('reservations.reservationDeleted') })
      } catch {
        Notify.create({ type: 'negative', message: this.$t('reservations.reservationDeleteFailed') })
      }
    },
    eventsForDate(date) {
      return this.reservations.reservations.filter((item) => this.isCalendarVisible(item.calendar_id) && this.occursOnDate(item, date))
    },
    visibleEventsForDate(date) {
      return this.eventsForDate(date)
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
        start: start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
        end: end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      })
    },
    reservationPrimaryLabel(item) {
      return item.calendar_name || this.$t('reservations.reservationCalendar')
    },
    reservationDetailsLabel(item) {
      return item.details || ''
    },
    reservationReserverLabel(item) {
      return item.author_name || item.created_by_name || this.$t('reservations.unnamedCreator')
    },
    formatWeekday(date) {
      return new Intl.DateTimeFormat(this.$i18n.locale, { weekday: 'short' }).format(new Date(`${date}T00:00:00`))
    },
    formatDayNumber(date) {
      return new Intl.DateTimeFormat(this.$i18n.locale, { day: 'numeric', month: 'numeric' }).format(new Date(`${date}T00:00:00`))
    },
    formatAgendaDate(date) {
      return new Intl.DateTimeFormat(this.$i18n.locale, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }).format(new Date(`${date}T00:00:00`))
    },
    formatWeekMonth(date) {
      const label = new Intl.DateTimeFormat(this.$i18n.locale, {
        month: 'long',
      }).format(new Date(`${date}T00:00:00`))

      return label.charAt(0).toUpperCase() + label.slice(1)
    },
    formatShortDate(date) {
      const current = parseCalendarDate(date)
      return `${current.getDate()}.${current.getMonth() + 1}.`
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

.calendar-print-title {
  display: none;
}

.sidebar-actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.sidebar-action-btn {
  min-height: 72px;
  text-align: center;
}

.sidebar-action-btn :deep(.q-btn__content) {
  width: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  text-align: center;
}

.sidebar-action-btn :deep(.q-btn__content > .q-icon) {
  width: 100%;
  display: flex;
  justify-content: center;
  margin: 0;
}

.sidebar-action-btn :deep(.q-btn__content > .block) {
  width: 100%;
  display: block;
  text-align: center;
  line-height: 1.2;
}

.reservations-shell {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 24px;
  min-height: calc(100vh - 220px);
}

.calendar-view-switch :deep(.q-btn) {
  min-height: 36px;
}

.reservations-sidebar-card,
.reservations-calendar-card {
  height: 100%;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--app-surface) 94%, white 6%) 0%, var(--app-surface) 100%);
  box-shadow: 0 18px 40px var(--app-shadow);
}

.reservations-sidebar {
  display: flex;
  min-width: 0;
  min-height: 0;
}

.reservations-sidebar-card {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
}

.reservations-sidebar-list {
  flex: 1 1 auto;
  min-height: 0;
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

:deep(.reservation-calendar-menu) {
  padding: 6px;
}

.reservation-calendar-option {
  border-radius: 10px;
  margin: 2px 0;
}

.reservation-calendar-option-group {
  margin-top: 6px;
  background:
    linear-gradient(90deg, color-mix(in srgb, var(--app-bg-elevated) 94%, var(--app-surface)) 0%, color-mix(in srgb, var(--app-bg-elevated) 82%, var(--app-surface)) 100%);
  border: 1px solid color-mix(in srgb, var(--app-border) 72%, transparent);
}

.reservation-calendar-option-group :deep(.q-item__section) {
  min-width: 0;
}

.reservation-calendar-group-label {
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--app-muted);
}

.reservation-calendar-option-child {
  padding-left: 10px;
}

.reservation-calendar-option-swatch-wrap {
  min-width: 28px;
}

.reservation-calendar-option-label {
  font-weight: 600;
}

.reservation-calendar-option-caption {
  font-size: 0.72rem;
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

.calendar-day-mode-content {
  position: relative;
  min-height: 100%;
  padding: 8px 4px 4px;
}

.mobile-week-stack {
  display: grid;
  gap: 14px;
  padding: 12px;
}

.mobile-week-stack :deep(.mobile-week-empty .q-calendar-day__day-container),
.mobile-week-stack :deep(.mobile-week-empty .q-calendar-day__pane),
.mobile-week-stack :deep(.mobile-week-empty .q-calendar-day__day),
.mobile-week-stack :deep(.mobile-week-empty .q-calendar-day__day-container > div:last-child) {
  min-height: 0 !important;
  height: auto !important;
}

.mobile-week-stack :deep(.mobile-week-empty .q-calendar-day__day) {
  background: color-mix(in srgb, var(--app-surface) 96%, transparent);
}

.mobile-week-stack :deep(.mobile-week-empty .q-calendar-day__day-interval),
.mobile-week-stack :deep(.mobile-week-empty .q-calendar-day__interval),
.mobile-week-stack :deep(.mobile-week-empty .q-calendar-day__head-day-event) {
  display: none !important;
}

.calendar-mode-toggle {
  background: color-mix(in srgb, var(--app-bg-elevated) 76%, var(--app-surface));
  border: 1px solid var(--app-border);
}

.calendar-mode-toggle :deep(.q-btn) {
  color: var(--app-primary);
}

.calendar-mode-toggle :deep(.q-btn.q-btn--active) {
  color: #fff;
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

.calendar-event-submeta {
  display: block;
  margin-top: 2px;
  font-size: 0.72rem;
  opacity: 0.72;
}

.calendar-more-events {
  color: var(--app-muted);
}

@page {
  size: landscape;
  margin: 14mm;
}

@media print {
  :global(body.reservations-print-mode) {
    background: #fff !important;
  }

  :global(body.reservations-print-mode .app-header),
  :global(body.reservations-print-mode .content-header),
  :global(body.reservations-print-mode .reservations-sidebar),
  :global(body.reservations-print-mode .calendar-toolbar),
  :global(body.reservations-print-mode .q-dialog),
  :global(body.reservations-print-mode .q-dialog__backdrop),
  :global(body.reservations-print-mode .q-menu),
  :global(body.reservations-print-mode .q-notification) {
    display: none !important;
  }

  :global(body.reservations-print-mode .q-layout),
  :global(body.reservations-print-mode .q-page-container),
  :global(body.reservations-print-mode .page-container),
  :global(body.reservations-print-mode .reservations-page),
  :global(body.reservations-print-mode .reservations-shell),
  :global(body.reservations-print-mode .reservations-calendar-area),
  :global(body.reservations-print-mode .reservations-calendar-card),
  :global(body.reservations-print-mode .reservations-calendar-wrap) {
    margin: 0 !important;
    padding: 0 !important;
    width: 100% !important;
    max-width: none !important;
    min-height: 0 !important;
  }

  :global(body.reservations-print-mode .reservations-shell) {
    display: block !important;
  }

  :global(body.reservations-print-mode .reservations-calendar-card) {
    border: 0 !important;
    box-shadow: none !important;
    background: #fff !important;
    width: calc(100% - 10mm) !important;
    max-width: calc(100% - 10mm) !important;
    height: 170mm !important;
    margin: 0 auto !important;
    padding: 4mm !important;
    display: flex !important;
    flex-direction: column !important;
    overflow: hidden !important;
    break-inside: avoid;
    page-break-inside: avoid;
    break-after: avoid-page;
    page-break-after: avoid;
  }

  .calendar-print-title {
    display: block;
    margin: 0;
    padding: 0 0 5mm;
    font-family: var(--font-display);
    font-size: 16pt;
    font-weight: 700;
    text-align: center;
    color: #000;
    text-transform: capitalize;
  }

  :global(body.reservations-print-mode .calendar-day-add) {
    display: none !important;
  }

  :global(body.reservations-print-mode .reservations-calendar-wrap) {
    flex: 1 1 auto !important;
    min-height: 0 !important;
    overflow: hidden !important;
  }

  :global(body.reservations-print-mode .calendar-day-content) {
    min-height: 0 !important;
    padding: 3px 2px 1px !important;
  }

  :global(body.reservations-print-mode .calendar-day-events) {
    gap: 1px !important;
    margin-top: 0 !important;
  }

  :global(body.reservations-print-mode .calendar-event-chip) {
    padding: 2px 3px !important;
    border-radius: 4px !important;
    box-shadow: none !important;
    break-inside: avoid;
    font-size: 7pt !important;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }

  :global(body.reservations-print-mode .calendar-event-time),
  :global(body.reservations-print-mode .calendar-more-events),
  :global(body.reservations-print-mode .calendar-event-meta),
  :global(body.reservations-print-mode .calendar-event-submeta) {
    font-size: 6pt !important;
    line-height: 1.05 !important;
  }

  :global(body.reservations-print-mode .calendar-event-title) {
    font-size: 7pt !important;
    line-height: 1.05 !important;
  }

  :global(body.reservations-print-mode .reservations-calendar-wrap .q-calendar-month),
  :global(body.reservations-print-mode .reservations-calendar-wrap .q-calendar-month__head--wrapper),
  :global(body.reservations-print-mode .reservations-calendar-wrap .q-calendar-month__head--weekdays),
  :global(body.reservations-print-mode .reservations-calendar-wrap .q-calendar-month__week),
  :global(body.reservations-print-mode .reservations-calendar-wrap .q-calendar-month__week--days),
  :global(body.reservations-print-mode .reservations-calendar-wrap .q-calendar-month__week),
  :global(body.reservations-print-mode .reservations-calendar-wrap .q-calendar-month__week--wrapper),
  :global(body.reservations-print-mode .reservations-calendar-wrap .q-calendar-month__day),
  :global(body.reservations-print-mode .reservations-calendar-wrap .q-calendar-month__head),
  :global(body.reservations-print-mode .reservations-calendar-wrap .q-calendar-month__body) {
    background: #fff !important;
    width: 100% !important;
    min-width: 0 !important;
    max-width: 100% !important;
    overflow: hidden !important;
  }

  :global(body.reservations-print-mode .reservations-calendar-wrap .q-calendar-month) {
    height: 100% !important;
    display: flex !important;
    flex-direction: column !important;
    break-inside: avoid;
    page-break-inside: avoid;
  }

  :global(body.reservations-print-mode .reservations-calendar-wrap .q-calendar-month__head) {
    flex: 0 0 auto !important;
  }

  :global(body.reservations-print-mode .reservations-calendar-wrap .q-calendar-month__body) {
    flex: 1 1 auto !important;
    min-height: 0 !important;
  }

  :global(body.reservations-print-mode .reservations-calendar-wrap .q-calendar-month__week--wrapper) {
    flex: 1 1 0 !important;
    min-height: 0 !important;
    height: auto !important;
  }

  :global(body.reservations-print-mode .reservations-calendar-wrap .q-calendar-month__head--weekday),
  :global(body.reservations-print-mode .reservations-calendar-wrap .q-calendar-month__day) {
    flex: 1 1 0 !important;
    width: calc(100% / 7) !important;
    min-width: 0 !important;
    max-width: calc(100% / 7) !important;
  }

  :global(body.reservations-print-mode .reservations-calendar-wrap .q-calendar-month__day) {
    min-height: 0 !important;
    height: auto !important;
    overflow: hidden !important;
  }

  :global(body.reservations-print-mode .reservations-calendar-wrap .q-calendar-month__head-day),
  :global(body.reservations-print-mode .reservations-calendar-wrap .q-calendar-month__day--label),
  :global(body.reservations-print-mode .reservations-calendar-wrap .q-calendar-month__day-label) {
    font-size: 7pt !important;
    color: #000 !important;
  }
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
  height: auto;
  min-height: calc(100% - 34px);
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
:deep(.q-calendar-month__week--wrapper),
:deep(.q-calendar-month__week--events),
:deep(.q-calendar-month__day),
:deep(.q-calendar-month__workweek) {
  border-color: var(--app-border) !important;
}

:deep(.q-calendar-month__week),
:deep(.q-calendar-month__week--days),
:deep(.q-calendar-month__week--wrapper),
:deep(.q-calendar-month__day) {
  height: auto;
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
  text-transform: none;
}

:deep(.q-calendar-day__head--weekday),
:deep(.q-calendar-day__head-day-label .ellipsis) {
  text-transform: none;
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

  .reservations-calendar-area {
    order: 1;
  }

  .reservations-sidebar {
    order: 2;
  }

  .reservations-sidebar-list {
    max-height: none;
  }
}

@media (max-width: 700px) {
  .reservations-header-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .reservations-header-actions :deep(.q-btn) {
    min-width: 44px;
  }

  .sidebar-actions {
    grid-template-columns: 1fr;
  }

  .reservation-form-grid {
    grid-template-columns: 1fr;
  }

  .calendar-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .calendar-view-switch :deep(.q-btn-group) {
    width: 100%;
  }

  .calendar-view-switch :deep(.q-btn) {
    flex: 1 1 0;
  }
}
</style>
