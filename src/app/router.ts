import { createRouter, createWebHistory } from 'vue-router'
import TeleprompterPage from '@/pages/TeleprompterPage.vue'

const routes = [
  {
    path: '/',
    name: 'teleprompter',
    component: TeleprompterPage,
  },
  // Demo route to show modular component switching
  ...(import.meta.env.DEV ? [{
    path: '/modular-demo',
    name: 'modular-demo',
    component: () => import('@/pages/TeleprompterPageModular.vue'),
  }] : []),
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
