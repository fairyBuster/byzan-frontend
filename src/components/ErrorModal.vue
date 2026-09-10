<script setup>
import { computed } from 'vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  title: { type: String, default: 'Error' },
  // Pesan siap tampil. Dipakai kalau `error` tidak diisi.
  message: { type: String, default: '' },
  // Error mentah dari axios. Kalau diisi, komponen ini yang menerjemahkannya
  // jadi kalimat yang dimengerti user (mis. "Email atau password salah").
  error: { type: [Object, String, Error], default: null },
  // Memengaruhi pesan 401: 'login' | 'register' | ''
  context: { type: String, default: '' },
})

const emit = defineEmits(['close'])
const close = () => emit('close')

// ===== Penerjemah error =====

const FIELD_LABELS = {
  email: 'Email',
  username: 'Username',
  password: 'Password',
  password2: 'Konfirmasi password',
  confirm_password: 'Konfirmasi password',
  phone: 'Nomor telepon',
  phone_number: 'Nomor telepon',
  full_name: 'Nama lengkap',
  first_name: 'Nama depan',
  last_name: 'Nama belakang',
  birthday: 'Tanggal lahir',
  country: 'Negara',
  city: 'Kota',
  address: 'Alamat',
  gender: 'Jenis kelamin',
  rating: 'Rating',
  comment: 'Komentar',
  question: 'Pertanyaan',
  non_field_errors: '',
  detail: '',
}

const TRANSLATIONS = [
  [/no active account found with the given credentials/i, 'Email atau password salah.'],
  [/unable to log in with provided credentials/i, 'Email atau password salah.'],
  [/incorrect (password|credentials)/i, 'Email atau password salah.'],
  [/this field may not be blank/i, 'wajib diisi.'],
  [/this field is required/i, 'wajib diisi.'],
  [/already exists/i, 'sudah terdaftar, gunakan yang lain.'],
  [/enter a valid email/i, 'format email tidak valid.'],
  [/too short|at least \d+ characters/i, 'terlalu pendek.'],
  [/too common/i, 'terlalu umum, gunakan yang lebih kuat.'],
  [/entirely numeric/i, 'tidak boleh hanya berisi angka.'],
  [/(token|session) is invalid or expired/i, 'Sesi sudah berakhir, silakan login ulang.'],
  [/not found/i, 'Data tidak ditemukan.'],
]

const translate = (text) => {
  const str = String(text ?? '').trim()
  for (const [pattern, replacement] of TRANSLATIONS) {
    if (pattern.test(str)) return replacement
  }
  return str
}

const fromResponseData = (data) => {
  if (!data) return null

  if (typeof data === 'string') {
    // Backend kadang balas halaman HTML (500) — jangan tampilkan mentah
    if (/<[a-z][\s\S]*>/i.test(data)) return null
    return translate(data)
  }
  if (Array.isArray(data)) return translate(data.join(' '))
  if (typeof data !== 'object') return null

  for (const key of ['detail', 'message', 'error', 'non_field_errors']) {
    const value = data[key]
    if (value) return translate(Array.isArray(value) ? value.join(' ') : value)
  }

  const parts = Object.entries(data)
    .filter(([, v]) => v)
    .map(([key, value]) => {
      const text = translate(Array.isArray(value) ? value.join(' ') : value)
      const label = FIELD_LABELS[key] ?? key
      if (!label) return text
      return /^[a-z]/.test(text) ? `${label} ${text}` : `${label}: ${text}`
    })
    .filter(Boolean)

  return parts.length ? parts.join('\n') : null
}

const byStatus = (status, context) => {
  switch (status) {
    case 400: return 'Data yang dikirim belum benar. Periksa kembali isian Anda.'
    case 401: return context === 'login'
      ? 'Email atau password salah. Periksa kembali dan coba lagi.'
      : 'Sesi Anda sudah berakhir. Silakan login kembali.'
    case 403: return 'Anda tidak punya akses ke halaman atau data ini.'
    case 404: return 'Data yang Anda cari tidak ditemukan.'
    case 409: return 'Data sudah ada. Coba gunakan email atau username lain.'
    case 422: return 'Ada isian yang tidak valid. Periksa kembali form Anda.'
    case 429: return 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.'
    case 500:
    case 502:
    case 503:
    case 504: return 'Server sedang bermasalah. Coba beberapa saat lagi.'
    default: return 'Terjadi kesalahan. Silakan coba lagi.'
  }
}

const resolveError = (err, context) => {
  if (!err) return ''
  if (typeof err === 'string') return err

  // Tidak ada response = request tidak pernah sampai ke server
  if (!err.response) {
    if (err.code === 'ECONNABORTED' || /timeout/i.test(err.message || '')) {
      return 'Server tidak merespons. Periksa koneksi internet Anda lalu coba lagi.'
    }
    if (err.code === 'ERR_CANCELED') return 'Permintaan dibatalkan.'
    return 'Tidak bisa terhubung ke server. Periksa koneksi internet Anda, atau server sedang tidak aktif.'
  }

  // Pesan spesifik dari backend selalu lebih berguna daripada pesan generik
  return fromResponseData(err.response.data) || byStatus(err.response.status, context)
}

const displayMessage = computed(() => {
  if (props.error) return resolveError(props.error, props.context)
  return props.message || 'Terjadi kesalahan. Silakan coba lagi.'
})
</script>

<template>
  <div v-if="show" class="modal-backdrop" @click.self="close">
    <div class="modal-card" role="alertdialog" aria-modal="true">
      <h3 class="modal-title">{{ title }}</h3>
      <p class="modal-message">{{ displayMessage }}</p>
      <button class="modal-button" @click="close">Tutup</button>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10002;
}
.modal-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  width: 90%;
  max-width: 420px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.25);
  text-align: center;
  position: relative;
  margin: auto;
}
.modal-title { font-size: 20px; font-weight: 700; margin-bottom: 10px; color: #c0392b; }
/* pre-line supaya error multi-field tampil satu baris per field */
.modal-message { font-size: 14px; margin-bottom: 16px; white-space: pre-line; line-height: 1.5; }
.modal-button {
  background: #000;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  cursor: pointer;
}
.modal-button:hover { opacity: 0.9; }
</style>