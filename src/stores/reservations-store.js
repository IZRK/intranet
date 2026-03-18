import { defineStore } from 'pinia'
import { api } from 'boot/axios'

function normalizeGroup(group) {
  return {
    ...group,
    id: Number(group.id),
    sort_order: Number(group.sort_order || 0),
  }
}

function normalizeCalendar(calendar) {
  return {
    ...calendar,
    id: Number(calendar.id),
    group_id: calendar.group_id == null ? null : Number(calendar.group_id),
    sort_order: Number(calendar.sort_order || 0),
    allow_overlap: Boolean(Number(calendar.allow_overlap || 0)),
    is_active: Boolean(Number(calendar.is_active || 0)),
  }
}

function normalizeReservation(reservation) {
  return {
    ...reservation,
    id: Number(reservation.id),
    calendar_id: Number(reservation.calendar_id),
    created_by: reservation.created_by == null ? null : Number(reservation.created_by),
    updated_by: reservation.updated_by == null ? null : Number(reservation.updated_by),
    author_id: reservation.author_id == null ? null : Number(reservation.author_id),
    calendar_group_id:
      reservation.calendar_group_id == null ? null : Number(reservation.calendar_group_id),
    all_day: Boolean(reservation.all_day),
    calendar_allow_overlap: Boolean(reservation.calendar_allow_overlap),
  }
}

export const useReservationsStore = defineStore('reservations', {
  state: () => ({
    groups: [],
    calendars: [],
    reservations: [],
    feeds: {
      all: null,
    },
    range: null,
    loading: false,
    savingCalendar: false,
    savingGroup: false,
    savingReservation: false,
  }),

  actions: {
    async loadOverview(params = {}) {
      this.loading = true
      try {
        const { data } = await api.get('reservations/overview', { params })
        this.groups = (data.groups || []).map(normalizeGroup)
        this.calendars = (data.calendars || []).map(normalizeCalendar)
        this.reservations = (data.reservations || []).map(normalizeReservation)
        this.feeds = data.feeds || { all: null }
        this.range = data.range || null
        return data
      } finally {
        this.loading = false
      }
    },

    async createCalendar(payload) {
      this.savingCalendar = true
      try {
        const { data } = await api.post('reservations/create_calendar', payload)
        const calendar = normalizeCalendar(data.calendar)
        this.calendars = [...this.calendars, calendar].sort((a, b) => {
          if ((a.sort_order || 0) !== (b.sort_order || 0)) {
            return (a.sort_order || 0) - (b.sort_order || 0)
          }
          return String(a.name || '').localeCompare(String(b.name || ''))
        })
        return calendar
      } finally {
        this.savingCalendar = false
      }
    },

    async updateCalendar(payload) {
      this.savingCalendar = true
      try {
        const { data } = await api.post('reservations/update_calendar', payload)
        const calendar = normalizeCalendar(data.calendar)
        this.calendars = this.calendars.map((item) => (item.id === calendar.id ? calendar : item)).sort((a, b) => {
          if ((a.sort_order || 0) !== (b.sort_order || 0)) {
            return (a.sort_order || 0) - (b.sort_order || 0)
          }
          return String(a.name || '').localeCompare(String(b.name || ''))
        })
        return calendar
      } finally {
        this.savingCalendar = false
      }
    },

    async createGroup(payload) {
      this.savingGroup = true
      try {
        const { data } = await api.post('reservations/create_group', payload)
        const group = normalizeGroup(data.group)
        this.groups = [...this.groups, group].sort((a, b) => {
          if ((a.sort_order || 0) !== (b.sort_order || 0)) {
            return (a.sort_order || 0) - (b.sort_order || 0)
          }
          return String(a.name || '').localeCompare(String(b.name || ''))
        })
        return group
      } finally {
        this.savingGroup = false
      }
    },

    async updateGroup(payload) {
      this.savingGroup = true
      try {
        const { data } = await api.post('reservations/update_group', payload)
        const group = normalizeGroup(data.group)
        this.groups = this.groups.map((item) => (item.id === group.id ? group : item)).sort((a, b) => {
          if ((a.sort_order || 0) !== (b.sort_order || 0)) {
            return (a.sort_order || 0) - (b.sort_order || 0)
          }
          return String(a.name || '').localeCompare(String(b.name || ''))
        })
        return group
      } finally {
        this.savingGroup = false
      }
    },

    async createReservation(payload) {
      this.savingReservation = true
      try {
        const { data } = await api.post('reservations/create_reservation', payload)
        const reservation = normalizeReservation(data.reservation)
        this.reservations = [...this.reservations, reservation].sort(
          (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
        )
        return reservation
      } finally {
        this.savingReservation = false
      }
    },

    async updateReservation(payload) {
      this.savingReservation = true
      try {
        const { data } = await api.post('reservations/update_reservation', payload)
        const reservation = normalizeReservation(data.reservation)
        this.reservations = this.reservations.map((item) => (item.id === reservation.id ? reservation : item)).sort(
          (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
        )
        return reservation
      } finally {
        this.savingReservation = false
      }
    },

    async deleteReservation(payload) {
      this.savingReservation = true
      try {
        await api.post('reservations/delete_reservation', payload)
        this.reservations = this.reservations.filter((item) => item.id !== Number(payload.id))
      } finally {
        this.savingReservation = false
      }
    },
  },
})
