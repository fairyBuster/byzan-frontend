<script setup>
import { ref, reactive, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { getAssetUrl } from '../../utils/assets'
import SuccessModal from '../../components/SuccessModal.vue'
import ErrorModal from '../../components/ErrorModal.vue'

const props = defineProps({
  isModal: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'openRegister'])

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const form = reactive({ email: '', password: '' })
const showPassword = ref(false)
const showSuccess = ref(false)
const submitting = ref(false)

// Error mentah dari axios -> ErrorModal yang menerjemahkannya
const showError = ref(false)
const loginError = ref(null)
// Untuk error validasi sisi klien (tidak ada objek axios)
const clientError = ref('')
// Highlight kolom yang bermasalah
const fieldErrors = reactive({ email: '', password: '' })

const decorGridSrc = getAssetUrl('189_641.svg')
const decorGradientSrc = getAssetUrl('1fc0d4fdf08dabc7e59b35987474afc4af53522b.png')
const emailIconSrc = getAssetUrl('13e43ebf5f62eabbda48ea5302967399e071d8e1.png')
const passwordIconSrc = getAssetUrl('6d294b2d8f0ae1e8b140ce1ca6617953a6632de0.png')
const togglePasswordIconSrc = getAssetUrl('4918794ed8019be8bdfe4c68bf68d034dd64d2bd.png')

const isEmailValid = computed(() =>
  /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(form.email || '').trim())
)

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

const clearErrors = () => {
  showError.value = false
  loginError.value = null
  clientError.value = ''
  fieldErrors.email = ''
  fieldErrors.password = ''
}

const handleRegisterClick = () => {
  if (props.isModal) emit('openRegister')
  else router.push('/register')
}

const handleClose = () => {
  if (props.isModal) {
    emit('close')
  } else {
    const redirect = route.query.redirect || '/'
    router.push(redirect === '/login' ? '/' : String(redirect))
  }
}

// Validasi klien dulu: lebih cepat dan pesannya paling spesifik
const validate = () => {
  let valid = true
  if (!String(form.email || '').trim()) {
    fieldErrors.email = 'Email wajib diisi.'
    valid = false
  } else if (!isEmailValid.value) {
    fieldErrors.email = 'Format email tidak valid. Contoh: nama@email.com'
    valid = false
  }
  if (!form.password) {
    fieldErrors.password = 'Password wajib diisi.'
    valid = false
  }
  if (!valid) {
    clientError.value = [fieldErrors.email, fieldErrors.password].filter(Boolean).join('\n')
    showError.value = true
  }
  return valid
}

// Tandai kolom yang disebut backend, supaya user tahu persis mana yang salah
const applyFieldErrors = (error) => {
  const data = error?.response?.data
  const status = error?.response?.status
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const pick = (v) => (Array.isArray(v) ? v.join(' ') : String(v))
    if (data.email) fieldErrors.email = pick(data.email)
    if (data.username) fieldErrors.email = pick(data.username)
    if (data.password) fieldErrors.password = pick(data.password)
  }
  // 401 = kredensial salah, tandai kedua kolom (spasi = border merah tanpa teks ganda)
  if (status === 401) {
    fieldErrors.email = fieldErrors.email || ' '
    fieldErrors.password = fieldErrors.password || ' '
  }
}

const onSubmit = async () => {
  clearErrors()
  if (!validate()) return

  submitting.value = true
  try {
    await auth.login(form)
    showSuccess.value = true

    if (props.isModal) {
      setTimeout(() => emit('close'), 1200)
    } else {
      const redirect = route.query.redirect || '/'
      router.push(String(redirect))
    }
  } catch (e) {
    applyFieldErrors(e)
    loginError.value = e
    showError.value = true
    // Kosongkan password kalau kredensial salah
    if (e?.response?.status === 401) form.password = ''
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <main :class="props.isModal ? 'login-modal-content min-h-screen fixed top-0 left-0 right-0 bottom-0 bg-white/20 backdrop-blur-sm flex items-center justify-center' : 'login-modal-page'">
    <div class="login-card">
      <div class="card-background-decor">
        <img :src="decorGridSrc" alt="" aria-hidden="true" class="decor-grid" />
        <img :src="decorGradientSrc" alt="" aria-hidden="true" class="decor-gradient-1" />
        <img :src="decorGradientSrc" alt="" aria-hidden="true" class="decor-gradient-2" />
      </div>

      <div class="login-content">
        <button class="close-button" aria-label="Tutup" @click="handleClose">x</button>

        <h1 class="login-title">Login</h1>
        <p class="login-subtitle">Halo, Selamat datang kembali di <br />Byzan Education!</p>

        <form class="login-form" @submit.prevent="onSubmit" novalidate>
          <div class="field">
            <div class="form-group" :class="{ 'form-group--error': fieldErrors.email }">
              <img :src="emailIconSrc" alt="" aria-hidden="true" class="input-icon" />
              <input
                v-model="form.email"
                type="email"
                id="email"
                name="email"
                class="form-input"
                placeholder="Email"
                autocomplete="email"
                :aria-invalid="!!fieldErrors.email"
                @input="fieldErrors.email = ''"
              />
              <div v-if="isEmailValid && !fieldErrors.email" class="verified-status">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="verified-icon" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" /><path d="m8 12 3 3 5-6" />
                </svg>
                <span>Valid</span>
              </div>
            </div>
            <p v-if="fieldErrors.email && fieldErrors.email.trim()" class="field-error">{{ fieldErrors.email }}</p>
          </div>

          <div class="field">
            <div class="form-group" :class="{ 'form-group--error': fieldErrors.password }">
              <img :src="passwordIconSrc" alt="" aria-hidden="true" class="input-icon" />
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                id="password"
                name="password"
                class="form-input"
                placeholder="Password"
                autocomplete="current-password"
                :aria-invalid="!!fieldErrors.password"
                @input="fieldErrors.password = ''"
              />
              <button
                type="button"
                class="toggle-password"
                :aria-label="showPassword ? 'Sembunyikan password' : 'Tampilkan password'"
                @click="togglePasswordVisibility"
              >
                <img :src="togglePasswordIconSrc" alt="" aria-hidden="true" />
              </button>
            </div>
            <p v-if="fieldErrors.password && fieldErrors.password.trim()" class="field-error">{{ fieldErrors.password }}</p>
          </div>

          <button type="submit" class="submit-button" :disabled="submitting || auth.loading">
            {{ (submitting || auth.loading) ? 'Memproses...' : 'Masuk' }}
          </button>
        </form>

        <SuccessModal
          :show="showSuccess"
          title="Login Berhasil"
          message="Anda berhasil masuk."
          @close="showSuccess = false"
        />
        <ErrorModal
          :show="showError"
          title="Login Gagal"
          :error="loginError"
          :message="clientError"
          context="login"
          @close="showError = false"
        />

        <p class="register-link">
          Belum punya akun?
          <button type="button" @click="handleRegisterClick" class="register-button">Daftar</button>
        </p>
      </div>
    </div>
  </main>
</template>

<style scoped>
.login-modal-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
  background-color: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(2px);
}

.login-modal-content {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.login-card {
  max-width: 693px;
  width: 100%;
  background-color: var(--color-white, #ffffff);
  border-radius: 39.5px;
  box-shadow: 0px 13px 18px 10px rgba(0, 0, 0, 0.25);
  position: relative;
  overflow: hidden;
}

.card-background-decor {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

.decor-grid {
  position: absolute;
  top: -299px;
  left: -519px;
  width: 1727px;
  height: 942px;
  opacity: 0.5;
}

.decor-gradient-1 {
  position: absolute;
  top: 252px;
  left: -236px;
  width: 630px;
  height: 460px;
}

.decor-gradient-2 {
  position: absolute;
  top: -263px;
  left: 420px;
  width: 701px;
  height: 564px;
  transform: rotate(169.84deg);
}

.login-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 42px 74px 60px;
}

.close-button {
  position: absolute;
  top: 20px;
  right: 35px;
  background: none;
  border: none;
  cursor: pointer;
  font-family: 'Nerko One', cursive;
  font-size: 36px;
  color: var(--primary-green, #009444);
  opacity: 0.8;
  padding: 0;
  line-height: 1;
  transition: opacity 0.2s;
}

.close-button:hover { opacity: 1; }

.login-title {
  color: var(--primary-green, #009444);
  font-size: 40px;
  font-weight: 700;
  margin: 0 0 14px 0;
  font-family: 'Montserrat', sans-serif;
}

.login-subtitle {
  color: var(--black, #000000);
  font-size: 16px;
  font-weight: 500;
  text-align: center;
  line-height: 1.25;
  margin: 0 0 40px 0;
  font-family: 'Montserrat', sans-serif;
}

.login-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.field {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group {
  display: flex;
  align-items: center;
  gap: 12px;
  background-color: var(--light-gray, #d9d9d9);
  border-radius: 11px;
  padding: 0 16px;
  height: 56px;
  width: 100%;
  border: 2px solid transparent;
  transition: border-color 0.2s, background-color 0.2s;
}

.form-group:focus-within { border-color: var(--primary-green, #009444); }

.form-group--error {
  border-color: #dc2626;
  background-color: #fef2f2;
}

.field-error {
  margin: 0;
  padding-left: 4px;
  color: #dc2626;
  font-family: 'Montserrat', sans-serif;
  font-size: 12.5px;
  font-weight: 600;
}

.input-icon {
  height: 24px;
  width: auto;
  flex-shrink: 0;
}

.form-input {
  flex-grow: 1;
  border: none;
  background: transparent;
  outline: none;
  font-family: 'Montserrat', sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: #333;
  width: 100%;
  min-width: 0;
}

.form-input::placeholder {
  color: var(--text-gray, #808080);
  font-weight: 600;
}

.verified-status {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--primary-green, #009444);
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
  font-family: 'Montserrat', sans-serif;
}

.verified-icon { width: 20px; height: 20px; }

.toggle-password {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.toggle-password img { width: 35px; height: auto; }

.submit-button {
  background-color: var(--black, #000000);
  color: var(--color-white, #ffffff);
  border-radius: 20px;
  height: 44px;
  border: none;
  font-family: 'Montserrat', sans-serif;
  font-size: 19px;
  font-weight: 600;
  padding: 0 40px;
  cursor: pointer;
  margin-top: 10px;
  transition: opacity 0.2s;
}

.submit-button:hover:not(:disabled) { opacity: 0.8; }
.submit-button:disabled { opacity: 0.6; cursor: not-allowed; }

.register-link {
  margin-top: 20px;
  font-size: 14px;
  color: var(--black, #000000);
  font-family: 'Montserrat', sans-serif;
}

.register-link a,
.register-button {
  color: var(--primary-green, #009444);
  font-weight: 600;
  text-decoration: none;
  background: none;
  border: none;
  cursor: pointer;
  font-family: 'Montserrat', sans-serif;
  font-size: 14px;
}

.register-link a:hover,
.register-button:hover { text-decoration: underline; }

@media (max-width: 768px) {
  .login-card { max-width: 90vw; }
  .login-content { padding: 40px 25px; }
  .login-title { font-size: 32px; }
  .login-subtitle { font-size: 14px; margin-bottom: 28px; }
  .login-form { gap: 18px; }
  .form-group { height: 50px; padding: 0 12px; }
  .form-input { font-size: 16px; }
  .submit-button { width: 100%; margin-top: 12px; }
}
</style>