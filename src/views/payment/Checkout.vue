<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from '../../components/AppHeader.vue'
import AppFooter from '../../components/AppFooter.vue'
import ErrorModal from '../../components/ErrorModal.vue'
import { useAuthStore } from '../../stores/auth'
import api from '../../services/api'
import { buyWithMidtrans } from '../../services/coursePayment'
import { getAssetUrl } from '../../utils/assets'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const course = ref(null)
const loading = ref(true)
const error = ref(null)
const paying = ref(false)
const payError = ref(null)
const showPayError = ref(false)
const payErrorMessage = ref('')

const courseId = route.params.courseId

const formatPrice = (price) => {
  const num = Number(price ?? 0)
  return `Rp ${num.toLocaleString('id-ID')}`
}

const heroImage = computed(() => {
  const c = course.value
  return c?.thumbnail || c?.thumbnail_url || c?.image || c?.featured_image || ''
})

const instructorName = computed(() => {
  const inst = course.value?.instructor
  if (!inst) return 'Byzan'
  if (typeof inst === 'string') return inst
  return inst.full_name || inst.username || inst.email || 'Byzan'
})

const fetchCourse = async () => {
  loading.value = true
  error.value = null
  try {
    const { data } = await api.get(`/courses/${courseId}/`)
    course.value = data
    if (Number(data?.price ?? 0) === 0) {
      router.replace({ name: 'course-details', params: { id: courseId } })
    }
  } catch (e) {
    console.error('[Checkout] Gagal fetch course:', e)
    const msg = e.response?.data?.message || e.response?.data?.error || e.response?.data?.detail || e.message
    error.value = msg || `Gagal memuat data kursus (ID: ${courseId}). Periksa koneksi atau coba lagi.`
  } finally {
    loading.value = false
  }
}

const handlePay = async () => {
  payError.value = null
  showPayError.value = false
  payErrorMessage.value = ''
  paying.value = true
  try {
    const data = await buyWithMidtrans(Number(courseId))
    const redirectUrl = data?.snap_redirect_url
    if (!redirectUrl) {
      throw new Error('Gagal mendapatkan URL pembayaran dari server')
    }
    window.location.href = redirectUrl
  } catch (e) {
    const resData = e.response?.data
    if (resData && typeof resData === 'object') {
      payError.value = Object.entries(resData)
        .map(([k, v]) => Array.isArray(v) ? `${k}: ${v.join(', ')}` : `${k}: ${v}`)
        .join(' | ')
    } else {
      payError.value = e.response?.data?.message || e.response?.data?.error || e.message || 'Gagal memproses pembayaran'
    }
    payErrorMessage.value = payError.value
    showPayError.value = true
  } finally {
    paying.value = false
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
  if (!auth.token) {
    router.push({ name: 'login', query: { redirect: route.fullPath } })
    return
  }
  fetchCourse()
})
</script>

<template>
  <div class="w-full max-w-full mx-auto relative bg-[#f8fafb] overflow-x-hidden min-h-screen flex flex-col">
    <AppHeader :is-authenticated="!!auth.token" :user="auth.user" @logout="logout" />

    <ErrorModal
      :show="showPayError"
      title="Gagal"
      :message="payErrorMessage"
      @close="showPayError = false"
    />

    <main class="flex-1">
      <!-- Breadcrumb -->
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        <div class="flex items-center gap-2 text-sm font-['Montserrat'] text-gray-400">
          <button class="hover:text-primary transition-colors" @click="goBack">Kursus</button>
          <span>/</span>
          <span class="text-primary font-semibold">Checkout</span>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-32 gap-4">
        <div class="w-10 h-10 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p class="font-['Montserrat'] text-sm text-gray-400">Memuat detail pembelian...</p>
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

      <!-- Main Content -->
      <div v-else class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20">
        <div class="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">

          <!-- LEFT: Course Detail -->
          <div class="lg:col-span-3 space-y-6">
            <!-- Thumbnail -->
            <div class="relative aspect-video w-full rounded-2xl overflow-hidden bg-gray-200 shadow-sm">
              <img
                v-if="heroImage"
                :src="heroImage"
                :alt="course?.title"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full bg-gradient-to-br from-primary/10 via-primary/5 to-transparent flex items-center justify-center">
                <svg class="w-16 h-16 text-primary/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
            </div>

            <!-- Title & Instructor -->
            <div>
              <h1 class="font-['Montserrat'] text-2xl lg:text-3xl font-extrabold text-gray-900 leading-tight mb-3">
                {{ course?.title }}
              </h1>
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold font-['Montserrat']">
                  {{ (instructorName || 'B')[0].toUpperCase() }}
                </div>
                <span class="font-['Montserrat'] text-sm text-gray-500">oleh <span class="text-gray-700 font-semibold">{{ instructorName }}</span></span>
              </div>
            </div>

            <!-- Description -->
            <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 class="font-['Montserrat'] text-sm font-bold text-gray-800 uppercase tracking-wide mb-3">Tentang Kursus</h3>
              <p class="font-['Montserrat'] text-sm text-gray-600 leading-relaxed">
                {{ course?.description || 'Tidak ada deskripsi.' }}
              </p>
            </div>

            <!-- What you'll get -->
            <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 class="font-['Montserrat'] text-sm font-bold text-gray-800 uppercase tracking-wide mb-4">Termasuk</h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div v-for="item in [
                  { icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z', label: 'Video pembelajaran' },
                  { icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Akses seumur hidup' },
                  { icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', label: 'Sertifikat kelulusan' },
                  { icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', label: 'Forum diskusi' },
                ]" :key="item.label" class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" :d="item.icon" />
                    </svg>
                  </div>
                  <span class="font-['Montserrat'] text-sm text-gray-700">{{ item.label }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- RIGHT: Order Summary -->
          <div class="lg:col-span-2">
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:sticky lg:top-28">
              <h3 class="font-['Montserrat'] text-lg font-bold text-gray-800 mb-6">Ringkasan Pesanan</h3>

              <!-- Course Summary -->
              <div class="flex gap-4 pb-5 border-b border-gray-100">
                <div class="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                  <img v-if="heroImage" :src="heroImage" :alt="course?.title" class="w-full h-full object-cover" />
                  <div v-else class="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                    <svg class="w-6 h-6 text-primary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-['Montserrat'] text-sm font-bold text-gray-800 leading-snug line-clamp-2">{{ course?.title }}</p>
                  <p class="font-['Montserrat'] text-xs text-gray-400 mt-1">{{ instructorName }}</p>
                </div>
              </div>

              <!-- Price Breakdown -->
              <div class="py-5 space-y-3 border-b border-gray-100">
                <div class="flex justify-between items-center">
                  <span class="font-['Montserrat'] text-sm text-gray-500">Harga Kursus</span>
                  <span class="font-['Montserrat'] text-sm font-semibold text-gray-700">{{ formatPrice(course?.price) }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="font-['Montserrat'] text-sm text-gray-500">Biaya Layanan</span>
                  <span class="font-['Montserrat'] text-sm text-emerald-600 font-semibold">Gratis</span>
                </div>
              </div>

              <!-- Total -->
              <div class="flex justify-between items-center py-5">
                <span class="font-['Montserrat'] text-base font-bold text-gray-900">Total</span>
                <span class="font-['Montserrat'] text-xl font-extrabold text-primary">{{ formatPrice(course?.price) }}</span>
              </div>

              <!-- Pay Button -->
              <button
                class="w-full bg-primary hover:bg-primary/90 text-white font-['Montserrat'] font-bold py-3.5 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/25 active:scale-[0.98]"
                :disabled="paying"
                @click="handlePay"
              >
                <span v-if="paying" class="flex items-center justify-center gap-2">
                  <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Memproses...
                </span>
                <span v-else>Bayar Sekarang</span>
              </button>

              <!-- Back Link -->
              <button
                class="w-full mt-3 text-gray-400 hover:text-gray-600 font-['Montserrat'] text-sm font-medium py-2 transition-colors"
                @click="goBack"
              >
                Kembali ke detail kursus
              </button>

              <!-- Payment Methods -->
              <div class="mt-6 pt-5 border-t border-gray-100">
                <p class="font-['Montserrat'] text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 text-center">Didukung oleh</p>
                <div class="flex items-center justify-center gap-3">
                  <div class="h-8 px-3 bg-gray-50 rounded-lg flex items-center justify-center">
                    <span class="font-['Montserrat'] text-[10px] font-bold text-gray-400">BCA</span>
                  </div>
                  <div class="h-8 px-3 bg-gray-50 rounded-lg flex items-center justify-center">
                    <span class="font-['Montserrat'] text-[10px] font-bold text-gray-400">BNI</span>
                  </div>
                  <div class="h-8 px-3 bg-gray-50 rounded-lg flex items-center justify-center">
                    <span class="font-['Montserrat'] text-[10px] font-bold text-gray-400">Mandiri</span>
                  </div>
                  <div class="h-8 px-3 bg-gray-50 rounded-lg flex items-center justify-center">
                    <span class="font-['Montserrat'] text-[10px] font-bold text-gray-400">GoPay</span>
                  </div>
                  <div class="h-8 px-3 bg-gray-50 rounded-lg flex items-center justify-center">
                    <span class="font-['Montserrat'] text-[10px] font-bold text-gray-400">QRIS</span>
                  </div>
                </div>
                <p class="text-center mt-3 font-['Montserrat'] text-[10px] text-gray-400">
                  Pembayaran diproses oleh <span class="font-semibold text-gray-500">Midtrans</span>
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>

    <AppFooter :is-authenticated="!!auth.token" :user="auth.user" @logout="logout" />
  </div>
</template>
