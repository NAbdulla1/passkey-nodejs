import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/password-login',
      name: 'password-login',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/PasswordLoginView.vue'),
    },
    {
      path: '/passkey-login',
      name: 'passkey-login',
      component: () => import('../views/PasskeyLoginView.vue'),
    },
    {
      path: '/health',
      name: 'health',
      component: () => import('../views/HealthView.vue'),
    },
    {
      path: '/passkeys',
      name: 'passkeys',
      component: () => import('../views/PasskeysListView.vue'),
    }
  ],
})

export default router
