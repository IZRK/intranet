# IZRK Intranet Frontend

Quasar 2 + Vite frontend for the IZRK intranet. The app uses Vue 3, Pinia, Vue Router 4, and a shared dark-mode visual system tuned for the IZRK intranet workflows.

## Features

- Login-first flow with protected routes
- JWT login flow backed by the PHP API
- Stateless axios client that always sends `Authorization: Bearer <token>`
- Slovenian primary UI with English secondary UI via i18n
- Language switching persisted in local storage and in the backend for logged-in users
- Password reset flow with dedicated screens and reset-mail routing
- Editable `Aktualno` bulletin-board homepage with:
  - rich HTML editing via `q-editor`
  - persisted revision history
  - revision summaries and expandable full diffs
- `Obveščanje` workspace for:
  - browsing recipient groups with visible member names
  - creating, editing, and deleting groups
  - composing SMS or HTML e-mail messages
  - previewing recipients and copying the recipient list
  - notification history with expandable bodies
  - one-click "send again" prefilling from history
  - sending through the PHP messaging endpoints
- Branded seal-based app icons, favicon set, header logo, and login logo

## Install

```bash
npm install
```

## Develop

```bash
npm run dev
```

The axios boot file always targets:

- `https://web.izrk.zrc-sazu.si`

The frontend calls the API through the server base URL, without hardcoding `index.php`.

## Quality checks

```bash
npm run lint
npm run build
```

## Main files

- [src/boot/axios.js](/app/intranet/fe/src/boot/axios.js)
- [src/boot/i18n.js](/app/intranet/fe/src/boot/i18n.js)
- [src/stores/auth-store.js](/app/intranet/fe/src/stores/auth-store.js)
- [src/stores/bulletin-store.js](/app/intranet/fe/src/stores/bulletin-store.js)
- [src/stores/language-store.js](/app/intranet/fe/src/stores/language-store.js)
- [src/stores/messaging-store.js](/app/intranet/fe/src/stores/messaging-store.js)
- [src/layouts/MainLayout.vue](/app/intranet/fe/src/layouts/MainLayout.vue)
- [src/pages/HomePage.vue](/app/intranet/fe/src/pages/HomePage.vue)
- [src/pages/LoginPage.vue](/app/intranet/fe/src/pages/LoginPage.vue)
- [src/pages/ObvescanjePage.vue](/app/intranet/fe/src/pages/ObvescanjePage.vue)
- [src/css/app.scss](/app/intranet/fe/src/css/app.scss)
- [public/izrk.webp](/app/intranet/fe/public/izrk.webp)
