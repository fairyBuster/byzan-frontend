<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from '../../components/AppHeader.vue'
import AppFooter from '../../components/AppFooter.vue'
import { useAuthStore } from '../../stores/auth'
import api from '../../services/api'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

// Nomor WhatsApp admin Byzan (sama dengan FloatingChatWidget & footer)
const WA_PHONE = '6285199111442'

const course = ref(null)
const loading = ref(true)
const error = ref(null)
const waUrl = ref('')
const openedInNewTab = ref(false)

const courseId = route.params.courseId

const formatPrice = (price) => {
  const num = Number(price ?? 0)
  return `Rp ${num.toLocaleString('id-ID')}`
}

const buildWaMessage = (data) => {
  const who = auth.user?.full_name ? ` ${auth.user.full_name}` : ''
  return [
    `Halo Byzan Edu, saya${who} ingin mendaftar kursus "${data?.title || ''}" (${formatPrice(data?.price)}).`,
    'Mohon informasi cara pembayaran dan pendaftarannya. Terima kasih.',
  ].join('\n')
}

const waLink = (text) => `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(text)}`

// Buka WhatsApp di tab baru. Return false bila diblokir popup blocker.
const openWhatsAppInNewTab = () => {
  if (!waUrl.value) return false
  const win = window.open(waUrl.value, '_blank')
  if (!win) return false
  try {
    win.opener = null
  } catch {
    // abaikan — tab tetap terbuka
  }
  return true
}

const fetchCourse = async () => {
  loading.value = true
  error.value = null
  try {
    const { data } = await api.get(`/courses/${courseId}/`)
    course.value = data
    // Course gratis tidak lewat halaman ini — enroll langsung dari halaman detail
    if (Number(data?.price ?? 0) === 0) {
      router.replace({ name: 'course-details', params: { id: courseId } })
      return
    }
    waUrl.value = waLink(buildWaMessage(data))
    // Course berbayar: buka WhatsApp admin di tab baru.
    // Kalau popup diblokir browser, lanjutkan di tab ini.
    openedInNewTab.value = openWhatsAppInNewTab()
    if (!openedInNewTab.value) {
      window.location.href = waUrl.value
    }
  } catch (e) {
    console.error('[Checkout] Gagal fetch course:', e)
    const msg = e.response?.data?.message || e.response?.data?.error || e.response?.data?.detail || e.message
    error.value = msg || `Gagal memuat data kursus (ID: ${courseId}). Periksa koneksi atau coba lagi.`
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.push({ name: 'course-details', params: { id: courseId } })
}

const logout = () => {
  auth.logout()
  router.push('/')
}

onMounted(() => {
  fetchCourse()
})
</script>

<template>
  <div class="w-full max-w-full mx-auto relative bg-[#f8fafb] overflow-x-hidden min-h-screen flex flex-col">
    <AppHeader :is-authenticated="!!auth.token" :user="auth.user" @logout="logout" />

    <main class="flex-1">
      <!-- Breadcrumb -->
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        <div class="flex items-center gap-2 text-sm font-['Montserrat'] text-gray-400">
          <button class="hover:text-primary transition-colors" @click="goBack">Kursus</button>
          <span>/</span>
          <span class="text-primary font-semibold">Checkout</span>
        </div>
      </div>

      <!-- Loading / Redirecting -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-32 gap-4">
        <div class="w-10 h-10 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p class="font-['Montserrat'] text-sm text-gray-400">Mengarahkan ke WhatsApp...</p>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="max-w-md mx-auto px-4 py-32 text-center">
        <div class="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <h3 class="font-['Montserrat'] text-lg font-bold text-gray-800 mb-2">Gagal Memuat</h3>
        <p class="font-['Montserrat'] text-sm text-gray-500 mb-6">{{ error }}</p>
        <button class="bg-primary hover:bg-primary/90 text-white font-['Montserrat'] font-semibold py-2.5 px-8 rounded-xl transition-colors" @click="fetchCourse">
          Coba Lagi
        </button>
      </div>

      <!-- Redirect fallback (tampil bila auto-redirect tidak jalan) -->
      <div v-else class="max-w-md mx-auto px-4 py-24 text-center">
        <div class="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <svg class="w-8 h-8 text-emerald-600" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.65.07-.3-.15-1.13-.42-2.15-1.33-.79-.71-1.33-1.58-1.48-1.88-.15-.3-.02-.47.13-.62.15-.15.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.62-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.47 0 1.45 1.06 2.86 1.21 3.06.15.2 2.09 3.2 5.07 4.37 2.98 1.16 2.98.77 3.52.72.54-.05 1.75-.71 2-1.4.25-.7.25-1.28.17-1.4-.07-.13-.27-.2-.57-.35z"/>
            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.28-1.38a9.88 9.88 0 0 0 4.76 1.21h.01c5.46 0 9.91-4.45 9.91-9.92C21.96 6.45 17.5 2 12.04 2zm0 18.11h-.01c-1.5 0-2.98-.4-4.27-1.17l-.31-.18-3.17.83.85-3.09-.2-.32a8.22 8.22 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.82 2.41a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23z"/>
          </svg>
        </div>
        <h3 class="font-['Montserrat'] text-lg font-bold text-gray-800 mb-2">
          {{ openedInNewTab ? 'WhatsApp dibuka di tab baru' : 'Mengarahkan ke WhatsApp' }}
        </h3>
        <p class="font-['Montserrat'] text-sm text-gray-500 mb-6">
          <template v-if="openedInNewTab">
            Lanjutkan pendaftaran
            <span v-if="course?.title" class="font-semibold text-gray-700">"{{ course.title }}"</span>
            di tab WhatsApp yang baru terbuka. Jika tidak terbuka, klik tombol di bawah.
          </template>
          <template v-else>
            Anda akan diarahkan ke WhatsApp admin untuk menyelesaikan pendaftaran
            <span v-if="course?.title" class="font-semibold text-gray-700">"{{ course.title }}"</span>.
            Jika tidak terarahkan otomatis, klik tombol di bawah.
          </template>
        </p>
        <a
          :href="waUrl"
          target="_blank"
          rel="noopener"
          class="inline-flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary/90 text-white font-['Montserrat'] font-bold py-3.5 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/25 active:scale-[0.98]"
        >
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.65.07-.3-.15-1.13-.42-2.15-1.33-.79-.71-1.33-1.58-1.48-1.88-.15-.3-.02-.47.13-.62.15-.15.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.62-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.47 0 1.45 1.06 2.86 1.21 3.06.15.2 2.09 3.2 5.07 4.37 2.98 1.16 2.98.77 3.52.72.54-.05 1.75-.71 2-1.4.25-.7.25-1.28.17-1.4-.07-.13-.27-.2-.57-.35z"/>
            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.28-1.38a9.88 9.88 0 0 0 4.76 1.21h.01c5.46 0 9.91-4.45 9.91-9.92C21.96 6.45 17.5 2 12.04 2zm0 18.11h-.01c-1.5 0-2.98-.4-4.27-1.17l-.31-.18-3.17.83.85-3.09-.2-.32a8.22 8.22 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.82 2.41a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23z"/>
          </svg>
          Buka WhatsApp
        </a>
        <button
          class="w-full mt-3 text-gray-400 hover:text-gray-600 font-['Montserrat'] text-sm font-medium py-2 transition-colors"
          @click="goBack"
        >
          Kembali ke detail kursus
        </button>
      </div>
    </main>

    <AppFooter :is-authenticated="!!auth.token" :user="auth.user" @logout="logout" />
  </div>
</template>
