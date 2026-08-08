<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from '../../components/AppHeader.vue'
import AppFooter from '../../components/AppFooter.vue'
import { useAuthStore } from '../../stores/auth'
import { getTransactions } from '../../services/coursePayment'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const status = ref('loading') // 'loading' | 'success' | 'pending' | 'error'
const message = ref('')
const transaction = ref(null)
let pollTimer = null

const orderId = route.query.order_id

const logout = () => {
  auth.logout()
  router.push('/')
}

const checkTransaction = async () => {
  try {
    const transactions = await getTransactions()
    const list = Array.isArray(transactions) ? transactions : (transactions?.results || [])

    if (orderId) {
      const found = list.find(t => t.trx_code === orderId || String(t.id) === String(orderId))
      if (found) {
        transaction.value = found
        if (found.status === 'paid' || found.status === 'settlement' || found.status === 'capture') {
          status.value = 'success'
          message.value = `Pembayaran berhasil! Anda sudah terdaftar di kursus "${found.course_title || ''}"`
          clearPolling()
        } else if (found.status === 'pending') {
          status.value = 'pending'
          message.value = 'Pembayaran Anda masih dalam proses. Halaman ini akan otomatis memeriksa status setiap 5 detik.'
        } else {
          status.value = 'error'
          message.value = `Status transaksi: ${found.status}`
          clearPolling()
        }
        return
      }
    }

    // No specific transaction found — show generic pending
    status.value = 'pending'
    message.value = 'Menunggu konfirmasi pembayaran...'
  } catch (e) {
    status.value = 'error'
    message.value = 'Gagal memeriksa status transaksi.'
    clearPolling()
  }
}

const startPolling = () => {
  clearPolling()
  pollTimer = setInterval(checkTransaction, 5000)
}

const clearPolling = () => {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

const goToMyCourses = () => {
  router.push({ name: 'my-courses' })
}

const goToHome = () => {
  router.push({ name: 'home' })
}

onMounted(() => {
  checkTransaction()
  startPolling()
})

onUnmounted(() => {
  clearPolling()
})
</script>

<template>
  <div class="w-full max-w-full mx-auto relative bg-white overflow-x-hidden min-h-screen flex flex-col">
    <AppHeader :is-authenticated="!!auth.token" :user="auth.user" @logout="logout" />

    <main class="flex-1 flex items-center justify-center px-6 py-20">
      <div class="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
        <!-- Loading -->
        <div v-if="status === 'loading'" class="flex flex-col items-center gap-4">
          <div class="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <h2 class="font-['Montserrat'] text-xl font-bold text-gray-800">Memeriksa Status Pembayaran</h2>
          <p class="font-['Montserrat'] text-sm text-gray-500">Mohon tunggu sebentar...</p>
        </div>

        <!-- Success -->
        <div v-else-if="status === 'success'" class="flex flex-col items-center gap-4">
          <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 class="font-['Montserrat'] text-xl font-bold text-gray-800">Pembayaran Berhasil!</h2>
          <p class="font-['Montserrat'] text-sm text-gray-500">{{ message }}</p>
          <div v-if="transaction" class="w-full bg-gray-50 rounded-lg p-4 text-left mt-2">
            <div class="flex justify-between text-sm mb-1">
              <span class="text-gray-500">Kode Transaksi</span>
              <span class="font-semibold text-gray-800">{{ transaction.trx_code }}</span>
            </div>
            <div class="flex justify-between text-sm mb-1">
              <span class="text-gray-500">Kursus</span>
              <span class="font-semibold text-gray-800">{{ transaction.course_title }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">Jumlah</span>
              <span class="font-semibold text-gray-800">Rp {{ Number(transaction.amount).toLocaleString('id-ID') }}</span>
            </div>
          </div>
          <button
            class="w-full bg-primary hover:bg-primary/90 text-white font-['Montserrat'] font-semibold py-3 px-6 rounded-lg transition-colors duration-200 mt-2"
            @click="goToMyCourses"
          >
            Lihat Kursus Saya
          </button>
        </div>

        <!-- Pending -->
        <div v-else-if="status === 'pending'" class="flex flex-col items-center gap-4">
          <div class="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg class="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 class="font-['Montserrat'] text-xl font-bold text-gray-800">Menunggu Pembayaran</h2>
          <p class="font-['Montserrat'] text-sm text-gray-500">{{ message }}</p>
          <button
            class="w-full bg-primary hover:bg-primary/90 text-white font-['Montserrat'] font-semibold py-3 px-6 rounded-lg transition-colors duration-200 mt-2"
            @click="goToHome"
          >
            Kembali ke Beranda
          </button>
        </div>

        <!-- Error -->
        <div v-else class="flex flex-col items-center gap-4">
          <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 class="font-['Montserrat'] text-xl font-bold text-gray-800">Pembayaran Gagal</h2>
          <p class="font-['Montserrat'] text-sm text-gray-500">{{ message }}</p>
          <button
            class="w-full bg-primary hover:bg-primary/90 text-white font-['Montserrat'] font-semibold py-3 px-6 rounded-lg transition-colors duration-200 mt-2"
            @click="goToHome"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    </main>

    <AppFooter :is-authenticated="!!auth.token" :user="auth.user" @logout="logout" />
  </div>
</template>
