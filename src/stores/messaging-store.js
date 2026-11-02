import { defineStore } from 'pinia'
import { api } from 'boot/axios'

export const useMessagingStore = defineStore('messaging', {
  state: () => ({
    groups: [],
    users: [],
    history: [],
    historyTotal: 0,
    historyHasMore: false,
    loading: false,
    historyLoading: false,
    error: null,
  }),

  actions: {
    async load() {
      this.loading = true
      this.error = null
      try {
        const [{ data: groupsData }, { data: usersData }] = await Promise.all([
          api.get('messaging/groups'),
          api.get('messaging/users'),
        ])
        this.groups = groupsData.groups
        this.users = usersData.users
      } catch (err) {
        this.error = err
      } finally {
        this.loading = false
      }
    },

    async createGroup(payload) {
      const { data } = await api.post('messaging/create_group', payload)
      await this.load()
      return data
    },

    async updateGroup(payload) {
      const { data } = await api.post('messaging/update_group', payload)
      await this.load()
      return data
    },

    async deleteGroup(id) {
      const { data } = await api.post('messaging/delete_group', { id })
      await this.load()
      return data
    },

    async loadHistory({ offset = 0, limit = 10, append = false } = {}) {
      this.historyLoading = true
      try {
        const { data } = await api.get('messaging/history', {
          params: { offset, limit },
        })
        this.history = append ? [...this.history, ...data.items] : data.items
        this.historyTotal = data.total
        this.historyHasMore = data.has_more
        return data
      } finally {
        this.historyLoading = false
      }
    },

    async send(payload) {
      const { attachments = [], ...message } = payload
      let body = message
      let config = {}
      if (message.method === 'email' && attachments.length) {
        body = new FormData()
        body.append('payload', JSON.stringify(message))
        attachments.forEach((file) => body.append('attachments[]', file))
        config = { headers: { 'Content-Type': 'multipart/form-data' } }
      }
      const { data } = await api.post('messaging/send', body, config)
      return data
    },
  },
})
