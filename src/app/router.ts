import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import TeleprompterPage from '@/pages/TeleprompterPage.vue'

// Device enrollment / mTLS debug pages exercise real enrollment services against
// live devices and must never ship in production builds.
const devOnlyRoutes: RouteRecordRaw[] = import.meta.env.DEV
  ? [
      {
        path: '/device-enrollment-test',
        name: 'device-enrollment-test',
        component: () => import('@/pages/DeviceEnrollmentTest.vue'),
      },
      {
        path: '/mtls-client-test',
        name: 'mtls-client-test',
        component: () => import('@/pages/MTLSClientTest.vue'),
      },
      {
        path: '/desktop-mtls-test',
        name: 'desktop-mtls-test',
        component: () => import('@/pages/DesktopMTLSTest.vue'),
      },
    ]
  : []

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'teleprompter',
    component: TeleprompterPage,
  },
  {
    path: '/edit',
    name: 'editor',
    component: () => import('@/pages/EditorPage.vue'),
  },
  {
    path: '/oauth-callback',
    name: 'oauth-callback',
    component: () => import('@/pages/OAuthCallback.vue'),
  },
  ...devOnlyRoutes,
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
