# IZRK Intranet Frontend

Quasar 2 + Vite frontend for the IZRK intranet. The app uses Vue 3, Pinia, Vue Router 4, and a shared dual-theme visual system tuned for the IZRK intranet workflows. It ships as both a web app and a Capacitor-based mobile app.

<p>
  <a href="https://apps.apple.com/us/app/izrk-intranet/id6760788413" target="_blank" rel="noopener noreferrer">
    <img src="./public/appstore.webp" alt="Download on the App Store" height="52" />
  </a>
  <a href="https://play.google.com/store/apps/details?id=intranet.izrk" target="_blank" rel="noopener noreferrer">
    <img src="./public/play.webp" alt="Get it on Google Play" height="52" />
  </a>
</p>

## Features

- Login-first flow with protected routes
- JWT login flow backed by the PHP API
- Stateless axios client that always sends `Authorization: Bearer <token>`
- Slovenian primary UI with English secondary UI via i18n
- Language switching persisted in local storage and in the backend for logged-in users
- Light and dark theme switching with explicit theme tokens for both modes
- Theme preference persisted in local storage and in the backend for logged-in users
- Password reset flow with dedicated screens and reset-mail routing
- Profile page for self-service account updates
- Editable `Aktualno` bulletin-board homepage with:
  - rich HTML editing via `q-editor`
  - theme-aware rendering for bulletin content, including readable hyperlinks in both light and dark mode
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
- `Rezervacije` workspace for:
  - full-screen month calendar powered by `@quasar/quasar-ui-qcalendar`
  - mobile-friendly day and week views alongside the month view
  - theme-aware light/dark styling aligned with the rest of the intranet UI
  - grouped calendars in the sidebar, including expandable parent groups
  - toggling whole groups or individual calendars on and off
  - creating and editing calendar groups
  - creating calendars and reassigning them between groups
  - quick reservation creation with Quasar `q-date` and `q-time` pickers
  - group-level, calendar-level, and global subscription feed URLs for external calendar clients
  - ICS feed exports for external calendar subscriptions
  - reservation event chips that show the reserver name directly on the calendar
- Admin-only user management for creating, editing, searching, and deleting users
- Admin-only audit logs for reviewing system activity
- Capacitor mobile packaging with over-the-air bundle updates via Capgo
- Branded seal-based app icons, favicon set, header logo, and login logo

## Install

```bash
npm install
```

## Develop

```bash
npm run dev
```

The axios boot file currently targets:

- `https://web.izrk.zrc-sazu.si`

The frontend calls the API through the server base URL, without hardcoding `index.php`.

## Mobile build

```bash
npm run android
```
