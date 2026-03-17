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
