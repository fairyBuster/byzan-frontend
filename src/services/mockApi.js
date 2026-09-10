/**
 * mockApi.js — Mock layer untuk testing UI tanpa backend.
 *
 * Cara pakai:
 *   1. Buat file .env.local di root project, isi:  VITE_USE_MOCK=true
 *   2. Tambahkan 3 baris di src/services/api.js (lihat bagian bawah file ini)
 *   3. npm run dev
 *
 * Balik ke API asli: ubah VITE_USE_MOCK=false (atau hapus barisnya), restart dev server.
 *
 * Cara kerja: request interceptor mengganti `adapter` HANYA untuk request yang
 * cocok dengan route di bawah. Endpoint yang tidak ada di sini tetap jalan
 * normal ke backend — jadi bisa dipakai setengah-setengah kalau perlu.
 */

// ===== Konfigurasi =====
const LATENCY_MS = 600      // delay palsu, biar shimmer/skeleton kelihatan
const SIMULATE_ERROR = false // true = semua request gagal, untuk test ErrorState
// =======================

// ---------- Fixtures ----------

// Ganti dengan YouTube ID asli kalau mau video benar-benar main.
const YT = (id) => `https://www.youtube.com/watch?v=${id}`

const IMG = {
  jurumiyah: '/image/f72456441df4efd0eb5ecfda62f6b31c8d4550ef.png',
  nahwu: '/image/5bd5c69c68fe54919744198aea008ec38c5ccf96.png',
  mantiq: '/image/3b647ba86b93a6f6ad4d4e23cbca320ddd9bae05.png',
  shorof: '/image/54f333db7281a49580cc7f2362aa68664d3460ec.png',
}



const mockUser = {
  id: 1,
  username: 'ihsan',
  email: 'ihsan@byzanedu.com',
  full_name: 'Ihsan Nur Akmal',
  first_name: 'Ihsan',
  last_name: 'Nur Akmal',
  gender: 'male',
  phone: '6285199111442',
  birthday: '2003-04-17',
  country: 'Indonesia',
  city: 'Jakarta',
  address: 'Jl. Contoh No. 1, Jakarta Selatan',
  instagram_link: 'https://instagram.com/byzan.education',
  facebook_link: '',
  email_verified: true,
  role: 'author',
}

const buildLessons = (chapterId, titles, startId) =>
  titles.map((title, i) => ({
    id: startId + i,
    title,
    order: i + 1,
    duration_seconds: (8 + i * 3) * 60,
    is_completed: i === 0,
    youtube_url: YT(['dQw4w9WgXcQ', 'aqz-KE-bpKQ', '9bZkp7q19f0'][i % 3]),
    content:
      '<p>Ini konten <strong>dummy</strong> untuk lesson ini. Ganti dari admin CMS nanti.</p><ul><li>Poin pertama</li><li>Poin kedua</li></ul>',
    chapter_id: chapterId,
  }))

const courses = [
  {
    id: 1,
    title: 'Kursus Ilmu Jurumiyah',
    description:
      'Kitab Jurumiyah merupakan gerbang awal dalam mempelajari tata bahasa Arab — kunci penting untuk memahami Al-Qur\'an, hadits, dan literatur keislaman klasik. Kelas ini disusun bertahap dalam 8 sesi dengan metode Mesir.',
    thumbnail_url: IMG.jurumiyah,
    price: 0,
    instructor_name: 'Ust. Ahmad Fauzi',
    rating_avg: 4.8,
    rating_count: 24,
    buyers_count: 132,
    is_enrolled: true,
    total_lessons: 6,
    created_at: '2026-05-01T09:00:00Z',
    chapters: [
      {
        id: 11,
        title: 'Pengenalan Kalam',
        order: 1,
        lessons: buildLessons(11, ['Definisi Kalam', 'Pembagian Kalam', 'Tanda-tanda Isim'], 101),
      },
      {
        id: 12,
        title: 'I\'rab dan Tandanya',
        order: 2,
        lessons: buildLessons(12, ['Pengertian I\'rab', 'Rafa\' dan Nashab', 'Jar dan Jazm'], 104),
      },
    ],
  },
  {
    id: 2,
    title: 'Kursus Nahwu Dasar',
    description:
      'Lanjutan dari Jurumiyah. Membahas struktur jumlah ismiyah dan fi\'liyah secara praktis dengan banyak contoh dari Al-Qur\'an.',
    thumbnail_url: IMG.nahwu,
    price: 149000,
    instructor_name: 'Ust. Hasan Basri',
    rating_avg: 4.6,
    rating_count: 11,
    buyers_count: 48,
    is_enrolled: false,
    total_lessons: 3,
    created_at: '2026-04-12T09:00:00Z',
    chapters: [
      {
        id: 21,
        title: 'Jumlah Ismiyah',
        order: 1,
        lessons: buildLessons(21, ['Mubtada dan Khabar', 'Kana dan Saudaranya', 'Inna dan Saudaranya'], 201),
      },
    ],
  },
  {
    id: 3,
    title: 'Kursus Mantiq',
    description: 'Logika klasik Islam: tashawwur, tashdiq, qiyas, dan penerapannya dalam kajian ilmiah.',
    thumbnail_url: IMG.mantiq,
    price: 99000,
    instructor_name: 'Ust. Zainal Abidin',
    rating_avg: 4.9,
    rating_count: 7,
    buyers_count: 21,
    is_enrolled: false,
    total_lessons: 3,
    created_at: '2026-03-20T09:00:00Z',
    chapters: [
      {
        id: 31,
        title: 'Dasar Mantiq',
        order: 1,
        lessons: buildLessons(31, ['Tashawwur & Tashdiq', 'Kulliyat Khams', 'Qiyas'], 301),
      },
    ],
  },
  {
    id: 4,
    title: 'Kursus Shorof',
    description: 'Perubahan bentuk kata dalam bahasa Arab: wazan, tashrif, dan latihan penerapan.',
    thumbnail_url: IMG.shorof,
    price: 0,
    instructor_name: 'Ust. Ahmad Fauzi',
    rating_avg: null,
    rating_count: 0,
    buyers_count: 5,
    is_enrolled: false,
    total_lessons: 3,
    created_at: '2026-02-08T09:00:00Z',
    chapters: [
      {
        id: 41,
        title: 'Wazan Dasar',
        order: 1,
        lessons: buildLessons(41, ['Fi\'il Madhi', 'Fi\'il Mudhari', 'Fi\'il Amr'], 401),
      },
    ],
  },
]

const listCourses = () => courses.map(({ chapters, ...rest }) => rest)

// State mutable supaya POST terasa nyata (komentar/rating/pertanyaan baru muncul)
const state = {
  comments: {
    1: [
      { id: 1, user: mockUser.full_name, comment: 'Penjelasannya runtut, mudah diikuti pemula.', created_at: '2026-08-10T13:20:00Z' },
      { id: 2, user: 'Siti Aminah', comment: 'Alhamdulillah, sesi 3 sangat membantu.', created_at: '2026-08-12T08:05:00Z' },
    ],
  },
  reviews: {
    1: [
      { id: 1, user: 'Siti Aminah', rating: 5, created_at: '2026-08-12T08:00:00Z', updated_at: '2026-08-12T08:00:00Z' },
      { id: 2, user: 'Budi Santoso', rating: 4, created_at: '2026-08-11T10:00:00Z', updated_at: '2026-08-11T10:00:00Z' },
    ],
  },
  questions: {
    101: [
      {
        id: 1,
        user: 'Budi Santoso',
        question: 'Apa bedanya kalam menurut ahli nahwu dan ahli mantiq?',
        created_at: '2026-08-13T09:00:00Z',
        answer: 'Ahli nahwu menekankan lafaz yang tersusun dan berfaidah, sedangkan ahli mantiq pada makna.',
        answered_by: 'Ust. Ahmad Fauzi',
        answered_at: '2026-08-13T15:30:00Z',
      },
    ],
  },
  enrolled: new Set([1]),
  completedLessons: new Set([101]),
}

let nextId = 1000
const newId = () => ++nextId

const postCategories = [
  { id: 1, name: 'Pendidikan', slug: 'pendidikan', color: 'green' },
  { id: 2, name: 'Keislaman', slug: 'keislaman', color: 'green' },
  { id: 3, name: 'Perempuan', slug: 'perempuan', color: 'pink' },
  { id: 4, name: 'Ekonomi', slug: 'ekonomi', color: 'green' },
]

const posts = [
  {
    id: 1,
    title: 'Menumbuhkan Budaya Literasi di Pesantren',
    excerpt: 'Literasi bukan sekadar membaca, tapi kemampuan mencerna dan menuliskan kembali gagasan secara kritis.',
    thumbnail_url: IMG.shorof,
    author: 'Ihsan Nur Akmal',
    category: 1,
    published_at: '2026-08-14T09:00:00Z',
    comments_count: 4,
    rating: 4.8,
    slug: 'budaya-literasi-pesantren',
  },
  {
    id: 2,
    title: 'Peran Perempuan dalam Tradisi Keilmuan Islam',
    excerpt: 'Sejarah mencatat banyak muhaddithat yang menjadi guru bagi ulama besar.',
    thumbnail_url: IMG.mantiq,
    author: 'Siti Aminah',
    category: 3,
    published_at: '2026-08-09T09:00:00Z',
    comments_count: 9,
    rating: 4.9,
    slug: 'peran-perempuan-keilmuan-islam',
  },
  {
    id: 3,
    title: 'Ekonomi Syariah untuk Generasi Digital',
    excerpt: 'Bagaimana prinsip muamalah klasik diterapkan pada instrumen keuangan modern.',
    thumbnail_url: IMG.nahwu,
    author: 'Budi Santoso',
    category: 4,
    published_at: '2026-07-28T09:00:00Z',
    comments_count: 2,
    rating: 4.5,
    slug: 'ekonomi-syariah-generasi-digital',
  },
  {
    id: 4,
    title: 'Mengapa Nahwu Masih Relevan?',
    excerpt: 'Tanpa nahwu, pembacaan teks klasik kehilangan presisi maknanya.',
    thumbnail_url: IMG.jurumiyah,
    author: 'Ust. Hasan Basri',
    category: 2,
    published_at: '2026-07-15T09:00:00Z',
    comments_count: 6,
    rating: 4.7,
    slug: 'mengapa-nahwu-relevan',
  },
]

// ---------- Route table ----------

const parseBody = (data) => {
  if (!data) return {}
  if (typeof data === 'string') {
    try { return JSON.parse(data) } catch { return {} }
  }
  return data
}

const findCourse = (id) => courses.find((c) => c.id === Number(id)) || null

const withEnrollment = (course) => ({
  ...course,
  is_enrolled: state.enrolled.has(course.id),
  chapters: (course.chapters || []).map((ch) => ({
    ...ch,
    lessons: (ch.lessons || []).map((l) => ({
      ...l,
      is_completed: state.completedLessons.has(l.id),
    })),
  })),
})

/**
 * Setiap entry: [method, regexp path, handler(params, body, config)]
 * Handler mengembalikan data, atau { status, data } untuk status non-200.
 */
const routes = [

    // ===== Auth (mock login) =====
  // Kredensial dummy: email apa saja + password "byzan123"
  ['POST', /^\/auth\/(login|token)\/$/, (_p, body) => {
    const email = String(body.email || body.username || '').trim()
    const password = String(body.password || '')

    if (!email) {
      return { status: 400, data: { email: ['Email wajib diisi.'] } }
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return { status: 400, data: { email: ['Format email tidak valid.'] } }
    }
    if (password !== 'byzan123') {
      return { status: 401, data: { detail: 'Email atau password salah.' } }
    }

    const user = { ...mockUser, email }
    return {
      access: 'mock-access-token',
      refresh: 'mock-refresh-token',
      token: 'mock-access-token',
      user,
    }
  }],

  ['POST', /^\/auth\/token\/refresh\/$/, () => ({ access: 'mock-access-token' })],

  ['POST', /^\/auth\/register\/$/, (_p, body) => {
    const errors = {}
    if (!body.email) errors.email = ['Email wajib diisi.']
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(body.email)) errors.email = ['Format email tidak valid.']
    else if (body.email === mockUser.email) errors.email = ['Email ini sudah terdaftar.']
    if (!body.username) errors.username = ['Username wajib diisi.']
    else if (body.username === mockUser.username) errors.username = ['Username sudah dipakai.']
    if (!body.password) errors.password = ['Password wajib diisi.']
    else if (String(body.password).length < 8) errors.password = ['Password minimal 8 karakter.']
    if (body.password !== body.confirm_password) errors.confirm_password = ['Konfirmasi password tidak cocok.']

    if (Object.keys(errors).length) return { status: 400, data: errors }

    const user = { ...mockUser, email: body.email, username: body.username, full_name: body.full_name }
    return { access: 'mock-access-token', refresh: 'mock-refresh-token', token: 'mock-access-token', user }
  }],

  ['POST', /^\/auth\/logout\/$/, () => ({ detail: 'Logout berhasil.' })],
  ['GET', /^\/auth\/profile\/$/, () => mockUser],
  ['PUT', /^\/auth\/profile\/$/, (_p, body) => Object.assign(mockUser, body)],
  // ===== Courses =====
  ['GET', /^\/courses\/$/, () => listCourses()],

  ['GET', /^\/courses\/my\/$/, () =>
    courses
      .filter((c) => state.enrolled.has(c.id))
      .map((c) => {
        const all = (c.chapters || []).flatMap((ch) => ch.lessons || [])
        const done = all.filter((l) => state.completedLessons.has(l.id)).length
        return {
          id: c.id,
          title: c.title,
          thumbnail_url: c.thumbnail_url,
          rating: c.rating_avg,
          total_lessons: all.length,
          completed_lessons: done,
          instructor_name: c.instructor_name,
          progress_percent: all.length ? Math.round((done / all.length) * 100) : 0,
          is_enrolled: true,
          last_episode_id: all[done]?.id || all[0]?.id || null,
        }
      })],

  ['GET', /^\/courses\/my\/lessons\/(\d+)\/$/, ([id]) => {
    const c = findCourse(id)
    if (!c) return { status: 404, data: { detail: 'Course tidak ditemukan' } }
    if (!state.enrolled.has(c.id)) return { status: 403, data: { detail: 'Kursus ini belum Anda beli.' } }
    return withEnrollment(c)
  }],

  ['GET', /^\/courses\/(\d+)\/$/, ([id]) => {
    const c = findCourse(id)
    return c ? withEnrollment(c) : { status: 404, data: { detail: 'Course tidak ditemukan' } }
  }],

  ['GET', /^\/courses\/(\d+)\/comments\/$/, ([id]) => state.comments[id] || []],
  ['POST', /^\/courses\/(\d+)\/comments\/$/, ([id], body) => {
    const item = { id: newId(), user: mockUser.full_name, comment: body.comment, created_at: new Date().toISOString() }
    state.comments[id] = [item, ...(state.comments[id] || [])]
    return item
  }],

  ['GET', /^\/courses\/(\d+)\/reviews\/$/, ([id]) => state.reviews[id] || []],
  ['POST', /^\/courses\/(\d+)\/reviews\/$/, ([id], body) => {
    const list = state.reviews[id] || []
    const existing = list.find((r) => r.user === mockUser.full_name)
    const now = new Date().toISOString()
    if (existing) {
      existing.rating = Number(body.rating)
      existing.updated_at = now
      state.reviews[id] = [...list]
      return existing
    }
    const item = { id: newId(), user: mockUser.full_name, rating: Number(body.rating), created_at: now, updated_at: now }
    state.reviews[id] = [item, ...list]
    return item
  }],

  ['GET', /^\/courses\/lessons\/(\d+)\/questions\/$/, ([id]) => state.questions[id] || []],
  ['POST', /^\/courses\/lessons\/(\d+)\/questions\/$/, ([id], body) => {
    const item = {
      id: newId(),
      user: mockUser.full_name,
      question: body.question,
      created_at: new Date().toISOString(),
      answer: null,
    }
    state.questions[id] = [item, ...(state.questions[id] || [])]
    return item
  }],

  ['POST', /^\/courses\/buy\/free\/$/, (_p, body) => {
    const id = Number(body.course_id ?? body.id)
    state.enrolled.add(id)
    return { message: `Berhasil enroll ke kursus "${findCourse(id)?.title || ''}"` }
  }],
  ['POST', /^\/courses\/buy\/balance\/$/, (_p, body) => {
    const id = Number(body.course_id ?? body.id)
    state.enrolled.add(id)
    return { status: 'success', message: 'Pembelian kursus berhasil.' }
  }],
  ['POST', /^\/courses\/lesson\/complete\/$/, (_p, body) => {
    const id = Number(body.lesson_id ?? body.id)
    if (id) state.completedLessons.add(id)
    return { message: 'Lesson ditandai selesai.' }
  }],

  ['GET', /^\/courses\/(\d+)\/certificate\/$/, ([id]) => ({
    certificate_number: `BYZAN-${id}-2026`,
    code: `BYZAN-${id}-2026`,
    course_title: findCourse(id)?.title || 'Course',
    user_full_name: mockUser.full_name,
    issued_at: new Date().toISOString(),
    verify_url: `${window.location.origin}/certificates/verify/BYZAN-${id}-2026`,
  })],

  // ===== Posts =====
  ['GET', /^\/posts\/categories\/$/, () => postCategories],
  ['GET', /^\/posts\/$/, (_p, _b, config) => {
    const params = config.params || {}
    let list = [...posts]
    if (params.category) {
      const cat = postCategories.find((c) => c.slug === params.category)
      if (cat) list = list.filter((p) => p.category === cat.id)
    }
    if (params.search) {
      const q = String(params.search).toLowerCase()
      list = list.filter((p) => p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q))
    }
    return list
  }],

  // ===== Auth =====
  ['GET', /^\/auth\/profile\/$/, () => mockUser],
  ['PUT', /^\/auth\/profile\/$/, (_p, body) => Object.assign(mockUser, body)],

  // ===== Certificates =====
  ['GET', /^\/certificates\/([^/]+)\/verify\/$/, ([code]) => ({
    valid: true,
    code,
    message: 'Sertifikat valid dan terdaftar di Byzan Education.',
  })],
]

// ---------- Interceptor ----------

const resolveRoute = (config) => {
  const method = String(config.method || 'get').toUpperCase()
  // Buang baseURL & query string, sisakan path relatif saja
  let path = String(config.url || '')
  try {
    if (/^https?:\/\//i.test(path)) path = new URL(path).pathname
  } catch { /* biarkan apa adanya */ }
  path = path.split('?')[0]
  if (!path.startsWith('/')) path = `/${path}`

  for (const [m, pattern, handler] of routes) {
    if (m !== method) continue
    const match = pattern.exec(path)
    if (match) return { handler, params: match.slice(1) }
  }
  return null
}

export function installMockApi(api) {
  api.interceptors.request.use((config) => {
    const route = resolveRoute(config)
    if (!route) return config // endpoint tak dikenal -> lanjut ke backend asli

    config.adapter = () =>
      new Promise((resolve, reject) => {
        setTimeout(() => {
          const respond = (status, data) => ({
            data,
            status,
            statusText: status === 200 ? 'OK' : 'Error',
            headers: { 'content-type': 'application/json' },
            config,
            request: {},
          })

          if (SIMULATE_ERROR) {
            const err = new Error('Mock: simulated network error')
            err.config = config
            err.response = respond(500, { detail: 'Simulated server error' })
            return reject(err)
          }

          let result
          try {
            result = route.handler(route.params, parseBody(config.data), config)
          } catch (e) {
            const err = new Error(`Mock handler error: ${e.message}`)
            err.config = config
            err.response = respond(500, { detail: e.message })
            return reject(err)
          }

          const isEnvelope = result && typeof result === 'object' && 'status' in result && 'data' in result
          const status = isEnvelope ? result.status : 200
          const data = isEnvelope ? result.data : result

          if (status >= 400) {
            const err = new Error(`Mock: request failed with status ${status}`)
            err.config = config
            err.response = respond(status, data)
            return reject(err)
          }

          resolve(respond(status, data))
        }, LATENCY_MS)
      })

    return config
  })

  console.info(
    '%c[MOCK API AKTIF]',
    'background:#009444;color:#fff;padding:2px 6px;border-radius:3px;font-weight:bold',
    'Request ke endpoint yang dimock tidak menyentuh backend. Set VITE_USE_MOCK=false untuk kembali ke API asli.',
  )
}

/*
=====================================================================
 WIRING — tambahkan di src/services/api.js, setelah instance dibuat
 dan SETELAH interceptor auth (token) didaftarkan:
=====================================================================

  import { installMockApi } from './mockApi'

  // ... kode api instance & interceptor auth yang sudah ada ...

  if (import.meta.env.VITE_USE_MOCK === 'true') {
    installMockApi(api)
  }

  export default api

=====================================================================
 .env.local (root project, jangan di-commit)
=====================================================================

  VITE_USE_MOCK=true

=====================================================================
*/