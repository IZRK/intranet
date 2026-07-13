<template>
  <q-page class="page-wrap documents-page">
    <section class="content-header"><h1 class="page-title">{{ $t('documents.title') }}</h1></section>
    <div class="documents-grid">
      <aside class="documents-nav panel-card">
        <div class="documents-side-title">{{ $t('documents.categories') }}</div>
        <q-list padding>
          <q-item v-for="item in documents.categories" :key="item.id" clickable :active="item.id === documents.category?.id" active-class="documents-category-active" @click="select(item.slug)">
            <q-item-section avatar><q-icon name="folder" /></q-item-section><q-item-section>{{ item.name }}</q-item-section>
          </q-item>
        </q-list>
        <q-btn v-if="auth.isAdmin" flat no-caps icon="add" :label="$t('documents.newCategory')" @click="createCategory" />
      </aside>

      <main class="documents-main">
        <q-card v-if="documents.category" flat bordered class="panel-card bulletin-card">
          <q-card-section v-if="editing" class="q-gutter-md">
            <q-input v-model="draft.title" outlined :label="$t('documents.editorTitle')" />
            <q-editor v-model="draft.body" min-height="24rem" :toolbar="editorToolbar" :fonts="editorFonts" />
            <div class="bulletin-editor-actions"><q-btn unelevated color="primary" :label="$t('documents.save')" :loading="documents.saving" @click="save" /><q-btn flat no-caps :label="$t('documents.cancel')" @click="cancelEdit" /></div>
          </q-card-section>
          <q-card-section v-else class="bulletin-view">
            <q-btn v-if="auth.isAdmin" flat round dense color="primary" icon="edit" class="bulletin-edit-button" @click="startEdit"><q-tooltip>{{ $t('documents.edit') }}</q-tooltip></q-btn>
            <h2 class="document-bulletin-title">{{ documents.page?.title }}</h2>
            <div class="bulletin-html" v-html="documents.page?.body" />
          </q-card-section>
        </q-card>
        <button v-if="documents.page?.updated_at" type="button" class="bulletin-meta bulletin-meta-link" @click="toggleHistory">{{ meta }}</button>
        <q-card v-if="showHistory" flat bordered class="panel-card q-mt-md"><q-card-section><div class="panel-title">{{ $t('documents.history') }}</div></q-card-section><q-list separator><q-item v-for="item in documents.history" :key="item.id"><q-item-section><q-item-label>{{ item.title }}</q-item-label><q-item-label caption>{{ revisionMeta(item) }}</q-item-label></q-item-section></q-item></q-list></q-card>
      </main>

      <aside class="documents-files panel-card">
        <div class="documents-files-header"><div><div class="documents-side-title">{{ $t('documents.attachments') }}</div><div class="panel-subtitle">{{ documents.category?.name }}</div></div><q-btn v-if="auth.isAdmin" flat round dense icon="more_horiz"><q-menu><q-list><q-item clickable v-close-popup @click="renameCategory"><q-item-section>{{ $t('documents.renameCategory') }}</q-item-section></q-item><q-item clickable v-close-popup class="text-negative" @click="removeCategory"><q-item-section>{{ $t('documents.deleteCategory') }}</q-item-section></q-item></q-list></q-menu></q-btn></div>
        <div v-if="auth.isAdmin" class="documents-drop" :class="{ 'documents-drop-active': dragging }" @dragover.prevent="dragging = true" @dragleave="dragging = false" @drop.prevent="drop"><q-icon name="upload_file" size="28px" /><div>{{ $t('documents.dropFiles') }}</div><label class="cursor-pointer text-primary"><input class="hidden-input" type="file" multiple @change="pickFiles" />{{ $t('documents.chooseFiles') }}</label></div>
        <q-list v-if="documents.attachments.length" separator class="documents-attachments"><q-item v-for="attachment in documents.attachments" :key="attachment.id"><q-item-section avatar><q-icon :name="fileIcon(attachment.filename)" color="primary" size="30px" /></q-item-section><q-item-section><q-item-label class="ellipsis"><a :href="fileUrl(attachment.url)" target="_blank">{{ attachment.filename }}</a></q-item-label><q-item-label caption>{{ bytes(attachment.size_bytes) }}</q-item-label></q-item-section><q-item-section v-if="auth.isAdmin" side><div class="row no-wrap"><q-btn flat round dense icon="edit" @click="renameAttachment(attachment)" /><q-btn flat round dense color="negative" icon="delete" @click="removeAttachment(attachment)" /></div></q-item-section></q-item></q-list>
        <q-banner v-else rounded class="banner-info q-mt-md">{{ $t('documents.noAttachments') }}</q-banner>
      </aside>
    </div>
  </q-page>
</template>

<script>
import { defineComponent } from 'vue'
import { Dialog, Notify } from 'quasar'
import { API_BASE_URL } from 'boot/axios'
import { useAuthStore } from 'stores/auth-store'
import { useDocumentsStore } from 'stores/documents-store'

export default defineComponent({ name: 'DocumentsPage', data: () => ({ auth: useAuthStore(), documents: useDocumentsStore(), editing: false, showHistory: false, dragging: false, draft: { title: '', body: '' }, editorFonts: { sans: 'Source Sans 3', serif: 'Playfair Display', mono: 'Courier New' }, editorToolbar: [['left', 'center', 'right'], ['bold', 'italic', 'underline', 'strike'], ['quote', 'unordered', 'ordered'], ['link', 'removeFormat'], ['undo', 'redo'], ['fontSize', 'textColor', 'bgColor'], ['viewsource']] }),
  computed: { meta() { return this.$t('documents.lastUpdatedBy', { author: this.documents.page?.author_name || this.$t('home.unknownAuthor'), date: this.date(this.documents.page?.updated_at) }) } },
  async mounted() { await this.documents.loadCategories(); if (this.documents.categories.length) await this.select(this.documents.categories[0].slug) },
  methods: {
    async select(slug) { this.editing = false; this.showHistory = false; await this.documents.select(slug) },
    startEdit() { this.draft = { title: this.documents.page.title, body: this.documents.page.body }; this.editing = true }, cancelEdit() { this.editing = false },
    async save() { try { await this.documents.save(this.draft); this.editing = false; if (this.showHistory) await this.documents.loadHistory(); Notify.create({ type: 'positive', message: this.$t('documents.saved') }) } catch { Notify.create({ type: 'negative', message: this.$t('documents.saveFailed') }) } },
    async toggleHistory() { this.showHistory = !this.showHistory; if (this.showHistory) await this.documents.loadHistory() },
    createCategory() { Dialog.create({ title: this.$t('documents.newCategory'), prompt: { model: '', type: 'text' }, cancel: true, persistent: true }).onOk(async (name) => { try { const category = await this.documents.createCategory(name); await this.select(category.slug) } catch { Notify.create({ type: 'negative', message: this.$t('documents.categoryFailed') }) } }) },
    renameCategory() { Dialog.create({ title: this.$t('documents.renameCategory'), prompt: { model: this.documents.category.name, type: 'text' }, cancel: true }).onOk(async (name) => { await this.documents.renameCategory(name) }) },
    removeCategory() { Dialog.create({ title: this.$t('documents.deleteCategory'), message: this.$t('documents.deleteCategoryConfirm'), cancel: true }).onOk(async () => { await this.documents.deleteCategory(); if (this.documents.categories.length) await this.select(this.documents.categories[0].slug) }) },
    async drop(event) { this.dragging = false; await this.uploadFiles(event.dataTransfer.files) }, async pickFiles(event) { await this.uploadFiles(event.target.files); event.target.value = '' },
    async uploadFiles(files) { for (const file of files) { try { await this.documents.upload(file) } catch { Notify.create({ type: 'negative', message: this.$t('documents.uploadFailed', { name: file.name }) }) } } },
    renameAttachment(attachment) { Dialog.create({ title: this.$t('documents.renameFile'), prompt: { model: attachment.filename, type: 'text' }, cancel: true }).onOk((name) => this.documents.renameAttachment(attachment, name)) },
    removeAttachment(attachment) { Dialog.create({ title: this.$t('documents.deleteFile'), message: attachment.filename, cancel: true }).onOk(() => this.documents.deleteAttachment(attachment)) },
    fileIcon(name) { const ext = name.split('.').pop().toLowerCase(); if (['pdf'].includes(ext)) return 'picture_as_pdf'; if (['xls', 'xlsx', 'csv'].includes(ext)) return 'table_chart'; if (['doc', 'docx', 'odt'].includes(ext)) return 'article'; if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) return 'image'; if (['zip', 'rar', '7z'].includes(ext)) return 'folder_zip'; return 'draft' },
    fileUrl(path) { return `${API_BASE_URL}${path}` },
    bytes(value) { if (!value) return '0 B'; const units = ['B', 'KB', 'MB', 'GB']; const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1); return `${(value / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}` }, date(value) { return value ? new Intl.DateTimeFormat(this.$i18n.locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value.replace(' ', 'T'))) : '' }, revisionMeta(item) { return this.$t('home.revisionMeta', { author: item.author_name || this.$t('home.unknownAuthor'), date: this.date(item.created_at) }) },
  },
})
</script>
