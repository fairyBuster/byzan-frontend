import axios from 'axios'
import { installMockApi } from './mockApi'

function getCookie(name) {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop().split(';').shift()
  return null
}

function normalizeApiBaseUrl(raw) {
  const input = String(raw || '').trim()
  if (!input) return 'https://byzan-backend.byzanedu.com/api'
  const noTrailingSlash = input.replace(/\/+$/, '')
  if (noTrailingSlash.endsWith('/api')) return noTrailingSlash
  return `${noTrailingSlash}/api`
}

const authHeader = () => {}
const api = axios.create({
  baseURL: normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL),
  withCredentials: false,
})

// Dev diagnostics
if (import.meta.env?.DEV) {
  // eslint-disable-next-line no-console
  console.info('[api] baseURL:', api.defaults.baseURL)
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  const scheme = import.meta.env.VITE_AUTH_SCHEME || 'Bearer'
  if (token) {
    config.headers.Authorization = `${scheme} ${token}`
  }
  // Ensure JSON headers
  config.headers['Accept'] = 'application/json'
  if (!config.headers['Content-Type']) {
    config.headers['Content-Type'] = 'application/json'
  }
  const method = (config.method || 'get').toLowerCase()
  if (method !== 'get') {
    const csrf = getCookie('csrftoken')
    if (csrf) {
      config.headers['X-CSRFTOKEN'] = csrf
    }
  }
  return config
})

// ===== MOCK MODE =====
// Didaftarkan SETELAH interceptor auth di atas, supaya header tetap terpasang
// (walau tidak dipakai) dan urutan interceptor tidak berubah saat mock mati.
// Aktif hanya bila .env.local berisi VITE_USE_MOCK=true
if (import.meta.env.VITE_USE_MOCK === 'true') {
  installMockApi(api)
}
// =====================

// Auto-refresh access token on 401 and retry original request
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status
    const originalRequest = error.config || {}
    if (import.meta.env?.DEV) {
      const method = (originalRequest.method || 'get').toUpperCase()
      const url = originalRequest.url || '(unknown url)'
      // eslint-disable-next-line no-console
      console.warn(`[api] ${method} ${url} -> ${status ?? 'NETWORK_ERROR'}`)
    }
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const refresh = localStorage.getItem('refresh_token')
        if (refresh) {
          const { data } = await api.post('/auth/token/refresh/', { refresh }, { withCredentials: false })
          if (data?.access) {
            localStorage.setItem('token', data.access)
            const scheme = import.meta.env.VITE_AUTH_SCHEME || 'Bearer'
            originalRequest.headers = originalRequest.headers || {}
            originalRequest.headers.Authorization = `${scheme} ${data.access}`
            return api.request(originalRequest)
          }
        }
      } catch (e) {
        // If refresh fails, fall through to rejection
      }
    }
    return Promise.reject(error)
  }
)

// Manuscript submission service
export const manuscriptService = {
  async submitManuscript(formData) {
    try {
      // For now, we'll use EmailJS or a simple API endpoint
      // This is a placeholder - you'll need to configure your backend
      const response = await api.post('/manuscript/submit', formData)
      return response.data
    } catch (error) {
      console.error('Error submitting manuscript:', error)
      throw error
    }
  }
}

export default api