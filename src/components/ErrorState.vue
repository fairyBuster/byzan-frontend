<script setup>
import { computed } from 'vue'

const props = defineProps({
  // Objek error dari axios, atau string pesan
  error: {
    type: [Object, String],
    required: false,
    default: null,
  },
  // Varian tampilan: 'light' (bg terang) atau 'dark' (di atas bg gelap)
  variant: {
    type: String,
    required: false,
    default: 'light',
    validator: (v) => ['light', 'dark'].includes(v),
  },
  // Tampilkan tombol coba lagi
  showRetry: {
    type: Boolean,
    required: false,
    default: true,
  },
  loading: {
    type: Boolean,
    required: false,
    default: false,
  },
  // Judul & pesan override (opsional)
  title: {
    type: String,
    required: false,
    default: '',
  },
  message: {
    type: String,
    required: false,
    default: '',
  },
})

defineEmits(['retry'])

// Terjemahkan error teknis jadi bahasa yang dimengerti user
const parsed = computed(() => {
  const e = props.error

  // Override manual
  if (props.title || props.message) {
    return {
      kind: 'custom',
      title: props.title || 'Terjadi kesalahan',
      message: props.message || '',
      hint: '',
    }
  }

  if (!e) {
    return { kind: 'unknown', title: 'Terjadi kesalahan', message: 'Silakan coba lagi.', hint: '' }
  }

  // Kalau string biasa
  const raw = typeof e === 'string' ? e : (e?.message || '')
  const status = typeof e === 'object' ? (e?.response?.status ?? e?.status ?? null) : null
  const code = typeof e === 'object' ? (e?.code || '') : ''

  // Tidak ada koneksi internet
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return {
      kind: 'offline',
      title: 'Tidak ada koneksi internet',
      message: 'Perangkat kamu sedang offline. Sambungkan ke internet, lalu coba lagi.',
      hint: 'Cek WiFi atau data seluler kamu.',
    }
  }

  // Timeout
  if (code === 'ECONNABORTED' || /timeout/i.test(raw)) {
    return {
      kind: 'timeout',
      title: 'Koneksi terlalu lama',
      message: 'Server butuh waktu lebih lama dari biasanya untuk merespons.',
      hint: 'Coba lagi dalam beberapa saat.',
    }
  }

  // Network error (server mati / CORS / DNS)
  if (code === 'ERR_NETWORK' || /network\s*error/i.test(raw)) {
    return {
      kind: 'network',
      title: 'Tidak bisa terhubung ke server',
      message: 'Sepertinya ada gangguan jaringan atau server sedang tidak dapat dijangkau.',
      hint: 'Periksa koneksi internetmu, lalu coba lagi.',
    }
  }

  // Berdasarkan HTTP status
  if (status === 401) {
    return {
      kind: 'unauthorized',
      title: 'Sesi kamu telah berakhir',
      message: 'Silakan login kembali untuk melanjutkan.',
      hint: '',
    }
  }
  if (status === 403) {
    return {
      kind: 'forbidden',
      title: 'Akses ditolak',
      message: 'Kamu tidak memiliki izin untuk membuka halaman ini.',
      hint: '',
    }
  }
  if (status === 404) {
    return {
      kind: 'notfound',
      title: 'Konten tidak ditemukan',
      message: 'Halaman atau data yang kamu cari mungkin sudah dipindahkan atau dihapus.',
      hint: '',
    }
  }
  if (status === 429) {
    return {
      kind: 'ratelimit',
      title: 'Terlalu banyak permintaan',
      message: 'Kamu melakukan terlalu banyak permintaan dalam waktu singkat.',
      hint: 'Tunggu sebentar, lalu coba lagi.',
    }
  }
  if (status >= 500) {
    return {
      kind: 'server',
      title: 'Server sedang bermasalah',
      message: 'Ada gangguan di sisi server kami. Tim kami sedang menanganinya.',
      hint: 'Coba lagi dalam beberapa menit.',
    }
  }

  return {
    kind: 'unknown',
    title: 'Terjadi kesalahan',
    message: 'Kami tidak dapat memuat data saat ini.',
    hint: 'Coba muat ulang halaman.',
  }
})

// Detail teknis untuk developer (disembunyikan di balik toggle)
const technicalDetail = computed(() => {
  const e = props.error
  if (!e) return ''
  if (typeof e === 'string') return e
  const status = e?.response?.status
  const msg = e?.response?.data?.message || e?.response?.data?.detail || e?.message
  return [status ? `HTTP ${status}` : '', msg].filter(Boolean).join(' — ')
})

const isDark = computed(() => props.variant === 'dark')
</script>

<template>
  <div class="w-full flex items-center justify-center px-4 py-10">
    <div
      class="w-full max-w-md rounded-2xl px-6 py-8 text-center border"
      :class="isDark
        ? 'bg-white/10 border-white/15 backdrop-blur-md text-white'
        : 'bg-white border-gray-200 shadow-sm text-gray-900'"
    >
      <!-- Ikon per jenis error -->
      <div
        class="mx-auto mb-4 flex items-center justify-center w-14 h-14 rounded-full"
        :class="isDark ? 'bg-white/15' : 'bg-gray-100'"
      >
        <!-- Offline -->
        <svg v-if="parsed.kind === 'offline'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-7 h-7" :class="isDark ? 'text-white' : 'text-gray-500'">
          <path d="M12 20h.01" /><path d="M8.5 16.4a5 5 0 0 1 7 0" /><path d="m2 2 20 20" />
          <path d="M5 12.9a10 10 0 0 1 5.2-2.7" /><path d="M1.4 9.6a15 15 0 0 1 4.5-2.9" /><path d="M22.6 9.6a15 15 0 0 0-8-4.4" />
        </svg>
        <!-- Not found -->
        <svg v-else-if="parsed.kind === 'notfound'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-7 h-7" :class="isDark ? 'text-white' : 'text-gray-500'">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /><path d="M8 11h6" />
        </svg>
        <!-- Server / timeout -->
        <svg v-else-if="parsed.kind === 'server' || parsed.kind === 'timeout'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-7 h-7" :class="isDark ? 'text-white' : 'text-gray-500'">
          <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
        </svg>
        <!-- Default: warning -->
        <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-7 h-7" :class="isDark ? 'text-white' : 'text-gray-500'">
          <path d="M12 9v4" /><path d="M12 17h.01" />
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        </svg>
      </div>

      <h3 class="font-montserrat text-lg font-bold m-0 mb-1.5" :class="isDark ? 'text-white' : 'text-gray-900'">
        {{ parsed.title }}
      </h3>
      <p class="font-montserrat text-sm leading-relaxed m-0" :class="isDark ? 'text-white/80' : 'text-gray-600'">
        {{ parsed.message }}
      </p>
      <p v-if="parsed.hint" class="font-montserrat text-xs mt-2 m-0" :class="isDark ? 'text-white/60' : 'text-gray-400'">
        {{ parsed.hint }}
      </p>

      <!-- Aksi -->
      <div class="flex items-center justify-center gap-3 mt-6 flex-wrap">
        <button
          v-if="showRetry"
          type="button"
          class="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 font-montserrat font-semibold text-sm cursor-pointer border-0 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          :class="isDark ? 'bg-white text-primary hover:bg-white/90' : 'bg-primary text-white hover:opacity-90'"
          :disabled="loading"
          @click="$emit('retry')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4" :class="loading ? 'animate-spin' : ''">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" />
          </svg>
          {{ loading ? 'Memuat...' : 'Coba Lagi' }}
        </button>

        <slot name="actions" />
      </div>

      <!-- Detail teknis: tersembunyi, untuk debugging -->
      <details v-if="technicalDetail" class="mt-5 text-left">
        <summary
          class="cursor-pointer text-xs font-montserrat select-none list-none text-center"
          :class="isDark ? 'text-white/50 hover:text-white/70' : 'text-gray-400 hover:text-gray-600'"
        >
          Detail teknis
        </summary>
        <p
          class="mt-2 text-[11px] font-mono break-words rounded-lg px-3 py-2 m-0"
          :class="isDark ? 'bg-black/20 text-white/60' : 'bg-gray-50 text-gray-500'"
        >
          {{ technicalDetail }}
        </p>
      </details>
    </div>
  </div>
</template>

<style scoped>
details > summary::-webkit-details-marker {
  display: none;
}
</style>