import { defineStore } from 'pinia'
import { api } from 'boot/axios'

export const useDocumentsStore = defineStore('documents', {
  state: () => ({ categories: [], category: null, page: null, attachments: [], history: [], loading: false, saving: false }),
  actions: {
    async loadCategories() { const { data } = await api.get('documents/list'); this.categories = data.items || []; return this.categories },
    async select(slug) { this.loading = true; try { const { data } = await api.get('documents/current', { params: { category: slug } }); this.category = data.category; this.page = data.page; this.attachments = data.attachments || [] } finally { this.loading = false } },
    async save(payload) { this.saving = true; try { const { data } = await api.post('documents/save', { ...payload, category_id: this.category.id }); this.page = data.page } finally { this.saving = false } },
    async loadHistory() { const { data } = await api.get('documents/history', { params: { category: this.category.slug } }); this.history = data.items || [] },
    async createCategory(name) { const { data } = await api.post('documents/create_category', { name }); await this.loadCategories(); return data.category },
    async renameCategory(name) { const { data } = await api.post('documents/update_category', { category_id: this.category.id, name }); await this.loadCategories(); this.category = data.category; return data.category },
    async deleteCategory() { await api.post('documents/delete_category', { category_id: this.category.id }); await this.loadCategories() },
    async upload(file) { const form = new FormData(); form.append('category', this.category.slug); form.append('file', file); const { data } = await api.post('documents/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } }); this.attachments.unshift(data.attachment) },
    async renameAttachment(attachment, filename) { const { data } = await api.post('documents/rename_attachment', { id: attachment.id, filename }); Object.assign(attachment, data.attachment) },
    async deleteAttachment(attachment) { await api.post('documents/delete_attachment', { id: attachment.id }); this.attachments = this.attachments.filter((item) => item.id !== attachment.id) },
  },
})
