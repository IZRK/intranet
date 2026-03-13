import { defineStore } from 'pinia'
import { api } from 'boot/axios'

export const useBulletinStore = defineStore('bulletin', {
  state: () => ({
    page: null,
    history: [],
    historyTotal: 0,
    historyHasMore: false,
    loading: false,
    saving: false,
    historyLoading: false,
  }),

  actions: {
    async loadPage() {
      this.loading = true
      try {
        const { data } = await api.get('bulletin/current')
        this.page = data.page
        return data.page
      } finally {
        this.loading = false
      }
    },

    async savePage(payload) {
      this.saving = true
      try {
        const { data } = await api.post('bulletin/save', payload)
        this.page = data.page
        return data.page
      } finally {
        this.saving = false
      }
    },

    async loadHistory({ offset = 0, limit = 10, append = false } = {}) {
      this.historyLoading = true
      try {
        const { data } = await api.get('bulletin/history', { params: { offset, limit } })
        this.history = append ? [...this.history, ...data.items] : data.items
        this.historyTotal = data.total
        this.historyHasMore = data.has_more
        return data
      } finally {
        this.historyLoading = false
      }
    },
  },
})
