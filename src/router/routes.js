const routes = [
  {
    path: '/login',
    component: () => import('layouts/AuthLayout.vue'),
    children: [
      {
        path: '',
        name: 'login',
        component: () => import('pages/LoginPage.vue'),
        meta: { guestOnly: true },
      },
    ],
  },
  {
    path: '/reset-password',
    component: () => import('layouts/AuthLayout.vue'),
    children: [
      {
        path: '',
        name: 'reset-password',
        component: () => import('pages/ResetPasswordPage.vue'),
      },
    ],
  },
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('pages/HomePage.vue'),
        meta: { viewKey: 'home' },
      },
      {
        path: 'obvescanje',
        name: 'obvescanje',
        component: () => import('pages/ObvescanjePage.vue'),
        meta: { viewKey: 'messaging' },
      },
      {
        path: 'rezervacije',
        name: 'rezervacije',
        component: () => import('pages/RezervacijePage.vue'),
        meta: { viewKey: 'reservations' },
      },
      {
        path: 'reservations',
        redirect: { name: 'rezervacije' },
      },
      {
        path: 'vzdrzevanje',
        name: 'housekeeping',
        component: () => import('pages/HousekeepingPage.vue'),
        meta: { viewKey: 'housekeeping' },
      },
      {
        path: 'narocila',
        name: 'equipment-orders',
        component: () => import('pages/NarocilaPage.vue'),
        meta: { viewKey: 'equipment_orders' },
      },
      {
        path: 'dokumenti',
        name: 'documents',
        component: () => import('pages/DocumentsPage.vue'),
        meta: { viewKey: 'documents' },
      },
      {
        path: 'profil',
        name: 'profile',
        component: () => import('pages/ProfilePage.vue'),
        meta: { viewKey: 'profile' },
      },
      {
        path: 'uporabniki',
        name: 'users-admin',
        component: () => import('pages/UsersAdminPage.vue'),
        meta: { adminOnly: true, viewKey: 'users_admin' },
      },
      {
        path: 'dnevniki',
        name: 'audit-logs',
        component: () => import('pages/AuditLogsPage.vue'),
        meta: { adminOnly: true, viewKey: 'audit_logs' },
      },
    ],
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
