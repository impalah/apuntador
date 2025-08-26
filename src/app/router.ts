import { createRouter, createWebHistory } from 'vue-router'
import TeleprompterPage from '@/pages/TeleprompterPage.vue'

const routes = [
  {
    path: '/',
    name: 'teleprompter',
    component: TeleprompterPage,
  },
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
