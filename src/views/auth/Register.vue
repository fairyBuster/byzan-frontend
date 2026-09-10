<script setup>
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import AppHeader from '../../components/AppHeader.vue'
import AppFooter from '../../components/AppFooter.vue'
import SuccessModal from '../../components/SuccessModal.vue'
import ErrorModal from '../../components/ErrorModal.vue'
import { getAssetUrl } from '../../utils/assets'

const auth = useAuthStore()
const router = useRouter()

const form = reactive({
  gender: '',
  firstName: '',
  lastName: '',
  email: '',
  username: '',
  password: '',
  password2: '',
  phone_number: '',
  birthday: '',
  country: '',
  address: '',
  city: '',
})

const submitting = ref(false)
const showSuccess = ref(false)
const showError = ref(false)
// Error mentah axios -> diterjemahkan oleh ErrorModal
const registerError = ref(null)
// Pesan hasil validasi sisi klien (tidak ada objek axios)
const clientError = ref('')
// Pesan error per kolom
const fieldErrors = reactive({})

const isAuthenticated = computed(() => auth.isAuthenticated)

const logout = () => {
  auth.logout()
  router.push('/')
}

const clearErrors = () => {
  showError.value = false
  registerError.value = null
  clientError.value = ''
  Object.keys(fieldErrors).forEach((k) => delete fieldErrors[k])
}

const clearField = (name) => {
  if (fieldErrors[name]) delete fieldErrors[name]
}

// Normalisasi nomor telepon ke E.164 Indonesia (+62)
const normalizePhone = (phone) => {
  if (!phone) return ''
  const digits = String(phone).replace(/[^\d+]/g, '')
  if (digits.startsWith('+')) return digits
  if (digits.startsWith('0')) return `+62${digits.slice(1)}`
  if (digits.startsWith('62')) return `+${digits}`
  return `+62${digits}`
}

// Validasi klien: pesannya paling spesifik dan tidak perlu menunggu server
const validate = () => {
  const required = {
    gender: 'Jenis kelamin wajib dipilih.',
    firstName: 'Nama depan wajib diisi.',
    lastName: 'Nama belakang wajib diisi.',
    email: 'Email wajib diisi.',
    username: 'Username wajib diisi.',
    phone_number: 'Nomor telepon wajib diisi.',
    birthday: 'Tanggal lahir wajib diisi.',
    country: 'Negara wajib diisi.',
    city: 'Kota wajib diisi.',
    password: 'Password wajib diisi.',
    password2: 'Konfirmasi password wajib diisi.',
  }

  for (const [key, message] of Object.entries(required)) {
    if (!String(form[key] || '').trim()) fieldErrors[key] = message
  }

  if (form.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) {
    fieldErrors.email = 'Format email tidak valid. Contoh: nama@email.com'
  }
  if (form.username && form.username.trim().length < 3) {
    fieldErrors.username = 'Username minimal 3 karakter.'
  }
  if (form.phone_number && String(form.phone_number).replace(/\D/g, '').length < 9) {
    fieldErrors.phone_number = 'Nomor telepon tidak valid.'
  }
  if (form.password && form.password.length < 8) {
    fieldErrors.password = 'Password minimal 8 karakter.'
  }
  if (form.password && form.password2 && form.password !== form.password2) {
    fieldErrors.password2 = 'Konfirmasi password tidak sama dengan password.'
  }
  if (form.birthday) {
    const birth = new Date(form.birthday)
    if (!Number.isNaN(birth.getTime()) && birth > new Date()) {
      fieldErrors.birthday = 'Tanggal lahir tidak boleh di masa depan.'
    }
  }

  const messages = Object.values(fieldErrors)
  if (messages.length) {
    // Tampilkan maksimal 4 supaya modal tidak kepanjangan
    clientError.value = messages.slice(0, 4).join('\n')
      + (messages.length > 4 ? `\n(dan ${messages.length - 4} isian lain)` : '')
    showError.value = true
    return false
  }
  return true
}

// Petakan error backend ke kolom yang bersangkutan
const applyFieldErrors = (error) => {
  const data = error?.response?.data
  if (!data || typeof data !== 'object' || Array.isArray(data)) return
  const pick = (v) => (Array.isArray(v) ? v.join(' ') : String(v))
  const map = {
    email: 'email',
    username: 'username',
    password: 'password',
    confirm_password: 'password2',
    phone: 'phone_number',
    full_name: 'firstName',
  }
  for (const [apiKey, formKey] of Object.entries(map)) {
    if (data[apiKey]) fieldErrors[formKey] = pick(data[apiKey])
  }
}

const onSubmit = async () => {
  clearErrors()
  if (!validate()) return

  submitting.value = true
  try {
    const fullName = `${String(form.firstName || '').trim()} ${String(form.lastName || '').trim()}`
      .trim()
      .replace(/\s+/g, ' ')

    const payload = {
      full_name: fullName,
      username: form.username,
      email: form.email,
      phone: normalizePhone(form.phone_number),
      password: form.password,
      confirm_password: form.password2,
    }

    await auth.register(payload)
    showSuccess.value = true
    setTimeout(() => router.push('/'), 1200)
  } catch (e) {
    applyFieldErrors(e)
    registerError.value = e
    showError.value = true
  } finally {
    submitting.value = false
  }
}

// Asset URLs
const backgroundGradientSrc = getAssetUrl('1546614f57dbcbddaad5b7f9eda092ce3f610db4.png')
const bannerBgSrc = getAssetUrl('a4172cfc499709269cb30af84c815743998b654c.png')
const profilePicSrc = getAssetUrl('418ce2a6ab9bbfb81b05025a5cbf21a6e735def0.png')
const addPhotoIconSrc = getAssetUrl('189_554.svg')
const addPhotoBgSrc = getAssetUrl('6ccd223db609c590b56edaca230b879807e5948a.png')
const verifiedIconSrc = getAssetUrl('189_520.svg')
const dropdownArrowSrc = getAssetUrl('b68de90c44e40ada0ed4723e2922d3b77ad3c496.png')
const paperPlaneSrc = getAssetUrl('15f47f71f80b6474e00a66edd9fef321a837f795.png')

const isEmailValid = computed(() =>
  /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(form.email || '').trim())
)
</script>

<template>
  <div class="page-wrapper" :style="{ backgroundImage: `url('${backgroundGradientSrc}')` }">
    <AppHeader :is-authenticated="isAuthenticated" :user="auth.user" @logout="logout" />

    <SuccessModal
      :show="showSuccess"
      title="Pendaftaran Berhasil"
      message="Akun Anda berhasil dibuat. Selamat datang di Byzan Education!"
      @close="showSuccess = false"
    />
    <ErrorModal
      :show="showError"
      title="Pendaftaran Gagal"
      :error="registerError"
      :message="clientError"
      context="register"
      @close="showError = false"
    />

    <main class="account-section">
      <div class="banner-bg" :style="{ backgroundImage: `url('${bannerBgSrc}')` }"></div>

      <div class="container account-container">
        <aside class="profile-sidebar">
          <div class="profile-picture-wrapper">
            <img :src="profilePicSrc" alt="Foto profil" class="profile-picture" />
            <button type="button" class="add-photo-btn" aria-label="Tambah foto">
              <img :src="addPhotoIconSrc" alt="" aria-hidden="true" />
              <img :src="addPhotoBgSrc" alt="" aria-hidden="true" />
            </button>
          </div>
          <h2 class="profile-name">
            {{ (form.firstName || form.lastName) ? `${form.firstName} ${form.lastName}`.trim() : 'Your Full Name' }}
          </h2>
          <p class="profile-role">author</p>
        </aside>

        <form class="account-form" @submit.prevent="onSubmit" novalidate>
          <h1 class="form-title">Create Account</h1>

          <div class="form-grid">
            <div class="form-group">
              <label for="gender">Gender<span class="required-star">*</span></label>
              <select
                id="gender"
                v-model="form.gender"
                class="form-control"
                :class="{ 'form-control--error': fieldErrors.gender }"
                @change="clearField('gender')"
              >
                <option disabled value="">Pilih jenis kelamin</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
              <p v-if="fieldErrors.gender" class="field-error">{{ fieldErrors.gender }}</p>
            </div>

            <div class="form-group">
              <label for="first-name">First Name<span class="required-star">*</span></label>
              <input
                type="text"
                id="first-name"
                v-model="form.firstName"
                class="form-control"
                :class="{ 'form-control--error': fieldErrors.firstName }"
                @input="clearField('firstName')"
              />
              <p v-if="fieldErrors.firstName" class="field-error">{{ fieldErrors.firstName }}</p>
            </div>

            <div class="form-group">
              <label for="last-name">Last Name<span class="required-star">*</span></label>
              <input
                type="text"
                id="last-name"
                v-model="form.lastName"
                class="form-control"
                :class="{ 'form-control--error': fieldErrors.lastName }"
                @input="clearField('lastName')"
              />
              <p v-if="fieldErrors.lastName" class="field-error">{{ fieldErrors.lastName }}</p>
            </div>

            <div class="form-group">
              <label for="gmail">Email<span class="required-star">*</span></label>
              <div class="input-wrapper">
                <input
                  type="email"
                  id="gmail"
                  v-model="form.email"
                  class="form-control"
                  :class="{ 'form-control--error': fieldErrors.email }"
                  autocomplete="email"
                  @input="clearField('email')"
                />
                <div v-if="isEmailValid && !fieldErrors.email" class="verified-badge">
                  <img :src="verifiedIconSrc" alt="" aria-hidden="true" />
                  <span>Valid</span>
                </div>
              </div>
              <p v-if="fieldErrors.email" class="field-error">{{ fieldErrors.email }}</p>
            </div>

            <div class="form-group">
              <label for="phone_number">Phone Number<span class="required-star">*</span></label>
              <div class="input-wrapper">
                <input
                  type="tel"
                  id="phone_number"
                  v-model="form.phone_number"
                  class="form-control phone-input"
                  :class="{ 'form-control--error': fieldErrors.phone_number }"
                  placeholder="81234567890"
                  @input="clearField('phone_number')"
                />
                <div class="country-code-badge">
                  <span>+62</span>
                  <img :src="dropdownArrowSrc" alt="" aria-hidden="true" />
                </div>
              </div>
              <p v-if="fieldErrors.phone_number" class="field-error">{{ fieldErrors.phone_number }}</p>
            </div>

            <div class="form-group">
              <label for="birthday">Birthday<span class="required-star">*</span></label>
              <input
                type="date"
                id="birthday"
                v-model="form.birthday"
                class="form-control"
                :class="{ 'form-control--error': fieldErrors.birthday }"
                @input="clearField('birthday')"
              />
              <p v-if="fieldErrors.birthday" class="field-error">{{ fieldErrors.birthday }}</p>
            </div>

            <div class="form-group">
              <label for="country">Country<span class="required-star">*</span></label>
              <input
                type="text"
                id="country"
                v-model="form.country"
                class="form-control"
                :class="{ 'form-control--error': fieldErrors.country }"
                @input="clearField('country')"
              />
              <p v-if="fieldErrors.country" class="field-error">{{ fieldErrors.country }}</p>
            </div>

            <div class="form-group grid-full-width">
              <label for="address">Address</label>
              <input type="text" id="address" v-model="form.address" class="form-control" />
            </div>

            <div class="form-group grid-full-width">
              <label for="city">City<span class="required-star">*</span></label>
              <input
                type="text"
                id="city"
                v-model="form.city"
                class="form-control"
                :class="{ 'form-control--error': fieldErrors.city }"
                @input="clearField('city')"
              />
              <p v-if="fieldErrors.city" class="field-error">{{ fieldErrors.city }}</p>
            </div>

            <div class="form-group grid-full-width">
              <label for="username">Username<span class="required-star">*</span></label>
              <input
                type="text"
                id="username"
                v-model="form.username"
                class="form-control"
                :class="{ 'form-control--error': fieldErrors.username }"
                autocomplete="username"
                @input="clearField('username')"
              />
              <p v-if="fieldErrors.username" class="field-error">{{ fieldErrors.username }}</p>
            </div>

            <div class="form-group">
              <label for="password">Password<span class="required-star">*</span></label>
              <input
                type="password"
                id="password"
                v-model="form.password"
                class="form-control"
                :class="{ 'form-control--error': fieldErrors.password }"
                autocomplete="new-password"
                @input="clearField('password')"
              />
              <p v-if="fieldErrors.password" class="field-error">{{ fieldErrors.password }}</p>
              <p v-else class="field-hint">Minimal 8 karakter.</p>
            </div>

            <div class="form-group">
              <label for="password2">Repeat Password<span class="required-star">*</span></label>
              <input
                type="password"
                id="password2"
                v-model="form.password2"
                class="form-control"
                :class="{ 'form-control--error': fieldErrors.password2 }"
                autocomplete="new-password"
                @input="clearField('password2')"
              />
              <p v-if="fieldErrors.password2" class="field-error">{{ fieldErrors.password2 }}</p>
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn btn-dark" :disabled="submitting || auth.loading">
              {{ (submitting || auth.loading) ? 'Memproses...' : 'Create' }}
            </button>
          </div>
        </form>
      </div>

      <img :src="paperPlaneSrc" alt="" aria-hidden="true" class="paper-plane-deco" />
    </main>

    <AppFooter :is-authenticated="isAuthenticated" :user="auth.user" @logout="logout" />
  </div>
</template>

<style scoped>
.page-wrapper {
  max-width: 100%;
  margin: 0 auto;
  position: relative;
  min-height: 100vh;
  background-size: cover;
  background-position: top center;
  background-repeat: no-repeat;
}

.container {
  width: 100%;
  padding-left: 80px;
  padding-right: 80px;
  margin-left: auto;
  margin-right: auto;
  box-sizing: border-box;
}

.btn {
  padding: 8px 24px;
  border-radius: 5px;
  font-weight: 600;
  font-size: 18px;
  text-align: center;
  border: none;
  cursor: pointer;
  font-family: 'Montserrat', sans-serif;
  transition: opacity 0.2s;
}

.btn-dark {
  background-color: var(--dark-color, #000000);
  color: var(--light-color, #ffffff);
  border-radius: 25px;
  padding: 15px 40px;
  font-size: 18.6px;
  font-weight: 700;
}

.btn-dark:hover:not(:disabled) { opacity: 0.8; }
.btn-dark:disabled { opacity: 0.6; cursor: not-allowed; }

.required-star { color: red; }

.account-section {
  position: relative;
  padding-top: 158px;
  padding-bottom: 100px;
  min-height: 100vh;
  display: flex;
  align-items: flex-start;
}

.banner-bg {
  position: absolute;
  top: 0px;
  left: 0;
  width: 100%;
  height: 206px;
  background-size: cover;
  background-position: center;
  z-index: 1;
}

.account-container {
  display: flex;
  gap: 53px;
  align-items: flex-start;
  position: relative;
  z-index: 3;
}

.profile-sidebar {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding-top: 28px;
}

.profile-picture-wrapper {
  position: relative;
  width: 179px;
  height: 179px;
  margin-bottom: 13px;
}

.profile-picture {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0px 4px 4px 0px rgba(0, 0, 0, 0.25);
}

.add-photo-btn {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 44px;
  height: 44px;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
}

.add-photo-btn img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.profile-name {
  font-size: 18.6px;
  font-weight: 700;
  margin-bottom: 8px;
  font-family: 'Montserrat', sans-serif;
}

.profile-role {
  font-size: 15px;
  font-weight: 400;
  margin-bottom: 38px;
  font-family: 'Montserrat', sans-serif;
}

.account-form {
  margin-top: 48px;
  flex-grow: 1;
  position: relative;
  z-index: 3;
}

.form-title {
  font-size: 25px;
  font-weight: 600;
  margin-bottom: 14px;
  font-family: 'Montserrat', sans-serif;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px 42px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-group.grid-full-width { grid-column: 1 / -1; }

.form-group label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-gray, #808080);
  font-family: 'Montserrat', sans-serif;
}

.form-control {
  background-color: var(--input-bg, #d9d9d9);
  border: 2px solid transparent;
  border-radius: 9px;
  height: 47px;
  padding: 0 15px;
  font-size: 14px;
  width: 100%;
  box-sizing: border-box;
  font-family: 'Montserrat', sans-serif;
  transition: border-color 0.2s, background-color 0.2s;
}

.form-control:focus {
  outline: none;
  border-color: var(--primary-color, #009444);
}

.form-control--error {
  border-color: #dc2626;
  background-color: #fef2f2;
}

.field-error {
  margin: 0;
  color: #dc2626;
  font-size: 12px;
  font-weight: 600;
  font-family: 'Montserrat', sans-serif;
}

.field-hint {
  margin: 0;
  color: var(--text-gray, #808080);
  font-size: 11.5px;
  font-weight: 500;
  font-family: 'Montserrat', sans-serif;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.verified-badge {
  position: absolute;
  right: 15px;
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--primary-color, #009444);
  font-size: 12px;
  font-weight: 600;
  font-family: 'Montserrat', sans-serif;
  pointer-events: none;
}

.verified-badge img { width: 18px; height: 18px; }

.country-code-badge {
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
  background-color: var(--light-color, #ffffff);
  border-radius: 5px;
  padding: 5px 8px;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 15px;
  font-weight: 600;
  font-family: 'Montserrat', sans-serif;
  pointer-events: none;
}

.country-code-badge img { width: 18px; height: 19px; }

.phone-input { padding-left: 85px; }

.form-actions {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
}

.paper-plane-deco {
  position: absolute;
  left: 80px;
  bottom: 100px;
  width: 116px;
  transform: rotate(157.26deg);
  z-index: 0;
}

@media (max-width: 1200px) {
  .container { padding-left: 40px; padding-right: 40px; }
  .account-container { flex-direction: column; align-items: center; }
  .form-grid { grid-template-columns: 1fr; }
  .form-group.grid-full-width { grid-column: auto; }
  .form-actions { align-items: stretch; }
  .paper-plane-deco { display: none; }
}

@media (max-width: 768px) {
  .container { padding-left: 20px; padding-right: 20px; }
  .account-section { padding-top: 120px; }
  .form-grid { gap: 16px; }
  .btn-dark { width: 100%; }
}
</style>