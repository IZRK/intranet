const routes = [
  {
    path: '/login',
    component: () => import('layouts/AuthLayout.vue'),
    children: [
      { path: '', name: 'login', component: () => import('pages/LoginPage.vue'), meta: { guestOnly: true } },
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
      { path: '', name: 'home', component: () => import('pages/HomePage.vue') },
      { path: 'obvescanje', name: 'obvescanje', component: () => import('pages/ObvescanjePage.vue') },
      { path: 'rezervacije', name: 'rezervacije', component: () => import('pages/RezervacijePage.vue') },
      { path: 'profil', name: 'profile', component: () => import('pages/ProfilePage.vue') },
      {
        path: 'uporabniki',
        name: 'users-admin',
        component: () => import('pages/UsersAdminPage.vue'),
        meta: { adminOnly: true },
      },
    ],
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
