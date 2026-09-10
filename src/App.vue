<script setup>
import { onMounted, onBeforeUnmount } from 'vue'
import { useAuthStore } from './stores/auth'
import { useRouter } from 'vue-router'
import FloatingChatWidget from './components/FloatingChatWidget.vue'

const auth = useAuthStore()
const router = useRouter()

const IDLE_TIMEOUT_MS = 10 * 60 * 1000
const LAST_ACTIVITY_KEY = 'last_activity_at'

let lastWriteAt = 0
const updateActivity = () => {
  const now = Date.now()
  if (now - lastWriteAt < 5000) return
  lastWriteAt = now
  localStorage.setItem(LAST_ACTIVITY_KEY, String(now))
}

const checkIdle = () => {
  if (!auth.isAuthenticated) return
  const raw = localStorage.getItem(LAST_ACTIVITY_KEY)
  const last = raw ? Number(raw) : 0
  const now = Date.now()
  if (last && now - last > IDLE_TIMEOUT_MS) {
    auth.logout()
    router.push({ name: 'login' }).catch(() => {})
  }
}

let idleIntervalId = null
const onVisibilityOrFocus = () => {
  checkIdle()
  updateActivity()
}

const logout = () => {
  auth.logout()
  router.push({ name: 'login' })
}

// Ensure user profile is loaded when token exists
onMounted(() => {
  updateActivity()
  checkIdle()

  const events = ['mousedown', 'keydown', 'touchstart', 'scroll']
  events.forEach((evt) => window.addEventListener(evt, updateActivity, { passive: true }))
  window.addEventListener('focus', onVisibilityOrFocus)
  document.addEventListener('visibilitychange', onVisibilityOrFocus)
  idleIntervalId = window.setInterval(checkIdle, 30 * 1000)

  if (auth.isAuthenticated && !auth.user) {
    auth.fetchMe().catch(() => {
      // Silent fail; header will still reflect token-based auth
    })
  }
})

onBeforeUnmount(() => {
  const events = ['mousedown', 'keydown', 'touchstart', 'scroll']
  events.forEach((evt) => window.removeEventListener(evt, updateActivity))
  window.removeEventListener('focus', onVisibilityOrFocus)
  document.removeEventListener('visibilitychange', onVisibilityOrFocus)
  if (idleIntervalId) {
    clearInterval(idleIntervalId)
    idleIntervalId = null
  }
})
</script>

<template>

  <main class="content">
    <router-view />
  </main>

  <FloatingChatWidget />

</template>

<style scoped>
.nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: .75rem 1rem;
  border-bottom: 1px solid #eee;
}
nav { display: flex; gap: 1rem; }
.user { display: flex; gap: .75rem; }
.content { padding: 0px; }
button { padding: .4rem .75rem; }
</style>