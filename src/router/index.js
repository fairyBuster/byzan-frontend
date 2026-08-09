import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { trackNavigation } from '../services/tracker'

import Home from '../views/Home.vue'
import Login from '../views/auth/Login.vue'
import Register from '../views/auth/Register.vue'
import PersonalInfo from '../views/profile/PersonalInfo.vue'
import CourseIndex from '../views/course/Index.vue'
import CourseDetails from '../views/course/Details.vue'
import CourseUserIndex from '../views/courseuser/Index.vue'
import CourseUserLearning from '../views/courseuser/Learning.vue'
import Byzanpedia from '../views/book/Byzanpedia.vue'
import ContentIndex from '../views/content/Index.vue'
import ContentDetails from '../views/content/Details.vue'
import AboutIndex from '../views/about/Index.vue'
import CertificateVerify from '../views/certificates/Verify.vue'
import PaymentSuccess from '../views/payment/Success.vue'
import PaymentCheckout from '../views/payment/Checkout.vue'

const routes = [
  { path: '/', name: 'home', component: Home },
  { path: '/login', name: 'login', component: Login },
  { path: '/register', name: 'register', component: Register },
  { path: '/personal-info', name: 'personal-info', component: PersonalInfo, meta: { requiresAuth: true } },
  { path: '/course', name: 'course', component: CourseIndex },
  { path: '/course/:id', name: 'course-details', component: CourseDetails },
  { path: '/my-courses', name: 'my-courses', component: CourseUserIndex, meta: { requiresAuth: true } },
  { path: '/course/:courseId/learning', name: 'course-learning', component: CourseUserLearning, meta: { requiresAuth: false } },
  { path: '/byzanpedia', name: 'byzanpedia', component: Byzanpedia },
  { path: '/byzanpost', name: 'byzanpost', component: ContentIndex },
  { path: '/byzanpost/:id', name: 'byzanpost-details', component: ContentDetails },
  { path: '/about', name: 'about', component: AboutIndex },
  { path: '/certificates/verify/:code?', name: 'certificate-verify', component: CertificateVerify },
  { path: '/payment/success', name: 'payment-success', component: PaymentSuccess, meta: { requiresAuth: true } },
  { path: '/payment/checkout/:courseId', name: 'payment-checkout', component: PaymentCheckout, meta: { requiresAuth: true } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    if (to.hash) {
      return {
        el: to.hash,
        top: 0,
        behavior: 'smooth', 
      }
    }
    return {
      left: 0,
      top: 0,
    }
  },
})

router.beforeEach(async (to, from, next) => {
  const token = localStorage.getItem('token')
  const auth = useAuthStore()

  // Sync user profile when token exists but user info not loaded
  if (token && !auth.user) {
    try {
      await auth.fetchMe()
    } catch (e) {
      // Ignore errors here; guard logic continues
    }
  }

  if (to.meta.requiresAuth && !token) {
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else if ((to.name === 'login' || to.name === 'register') && token) {
    // Jika sudah login, blokir akses ke halaman login/register
    next({ name: 'home' })
  } else {
    next()
  }
})

// Track navigation events
router.afterEach((to, from) => {
  const auth = useAuthStore()
  trackNavigation(to, from, auth.user)
})

export default router
