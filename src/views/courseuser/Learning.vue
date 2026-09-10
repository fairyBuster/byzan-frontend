<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import AppHeader from '../../components/AppHeader.vue'
import AppFooter from '../../components/AppFooter.vue'
import { getAssetUrl } from '../../utils/assets'
import api from '../../services/api'
import { dummyCourses } from '../../data/dummyCourses.js'
import SuccessModal from '../../components/SuccessModal.vue'
import ErrorModal from '../../components/ErrorModal.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const isAuthenticated = computed(() => auth.isAuthenticated)

const logout = () => {
  auth.logout()
  router.push('/')
}

const course = ref(null)
const modules = ref([])
const lessons = ref([])
const currentLesson = ref(null)
const selectedModule = ref(null)
const modulesById = ref({})
const recommendedCourses = ref([])
const loading = ref(false)
const error = ref(null)
const openModules = ref(new Set())
const completingLessonId = ref(null)
const completeError = ref(null)
const questions = ref([])
const questionsLoading = ref(false)
const questionsError = ref(null)
const questionText = ref('')
const asking = ref(false)
const showAskSuccess = ref(false)
const showAskError = ref(false)
const askSuccessMessage = ref('')
const askError = ref(null)

// Player: tampilkan thumbnail dulu (facade), iframe baru dimuat saat diklik.
const playerActive = ref(false)

const dummyRecommendedCourses = [
  { id: 2, title: 'Kursus Nahwu', image: null, thumbnail: null, featured_image: null },
  { id: 3, title: 'Kursus Mantiq', image: null, thumbnail: null, featured_image: null },
]

const videoThumbnailSrc = getAssetUrl('8de126a496aa3535b193b674681ac3ff0368a390.png')
const recommendedCourse1Src = getAssetUrl('f72456441df4efd0eb5ecfda62f6b31c8d4550ef.png')

// URL media dari backend bisa relatif; samakan ke origin API
const API_ORIGIN = (() => {
  try {
    return new URL(api.defaults.baseURL).origin
  } catch {
    return ''
  }
})()
const normalizeMediaUrl = (url) => {
  if (!url) return null
  if (/^https?:\/\//i.test(url)) return url
  const path = String(url)
  return path.startsWith('/') ? `${API_ORIGIN}${path}` : `${API_ORIGIN}/${path}`
}

const formatLessonDuration = (minutes) => {
  if (!minutes && minutes !== 0) return '-'
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return m ? `${h} jam ${m} menit` : `${h} jam`
  }
  return `${minutes} menit`
}

const formatCourseDuration = formatLessonDuration

const getYouTubeId = (url) => {
  if (!url) return null
  try {
    const u = new URL(url)
    const host = u.hostname.replace('www.', '')
    if (host.includes('youtube.com') || host.includes('youtube-nocookie.com')) {
      const vid = u.searchParams.get('v')
      if (vid) return vid
      const parts = u.pathname.split('/')
      const embedIndex = parts.indexOf('embed')
      if (embedIndex !== -1 && parts[embedIndex + 1]) return parts[embedIndex + 1]
    }
    if (host === 'youtu.be') return u.pathname.slice(1)
  } catch (e) {
    // abaikan
  }
  return null
}

const getYouTubeThumbnail = (url) => {
  const id = getYouTubeId(url)
  return id ? `https://img.youtube.com/vi/${id}/maxresdefault.jpg` : null
}

const thumbnailSrc = computed(() => {
  const lessonThumb = getYouTubeThumbnail(currentLesson.value?.video_url)
  if (lessonThumb) return lessonThumb
  const courseThumbFromVideo = getYouTubeThumbnail(course.value?.video_url)
  if (courseThumbFromVideo) return courseThumbFromVideo
  return course.value?.thumbnail_url || videoThumbnailSrc
})

const onThumbError = (e) => {
  const id = getYouTubeId(currentLesson.value?.video_url)
  if (id && !e.target.dataset.fallback) {
    e.target.dataset.fallback = '1'
    e.target.src = `https://img.youtube.com/vi/${id}/hqdefault.jpg`
  } else {
    e.target.src = videoThumbnailSrc
  }
}

const loadCourseData = async (courseId) => {
  try {
    const { data } = await api.get(`/courses/${courseId}/`)
    return data || null
  } catch (e) {
    console.warn('Gagal ambil detail course, pakai data dummy:', e)
    return dummyCourses.find((c) => c.id === parseInt(courseId)) || dummyCourses[0]
  }
}

const loadRecommendedCourses = async (courseId) => {
  try {
    const { data } = await api.get('/courses/')
    const list = Array.isArray(data) ? data : (data?.results || [])
    return list.filter((c) => c.id !== parseInt(courseId)).slice(0, 3)
  } catch (e) {
    console.warn('Gagal ambil rekomendasi, pakai data dummy:', e)
    return dummyRecommendedCourses
  }
}

const mapCourseFromApi = (c) => {
  if (!c) return null
  const priceValue = Number(c.price ?? 0)

  // Backend mengirim `instructor` sebagai OBJEK:
  // { id, username, full_name, email, bio, profile_photo_url }
  // `full_name` sering kosong, jadi jatuhkan bertingkat ke username lalu email.
  const inst = c.instructor || null
  const instFullName = String(inst?.full_name || '').trim()
  const instUsername = String(inst?.username || '').trim()
  const instEmail = String(inst?.email || '').trim()
  const instName =
    instFullName ||
    instUsername ||
    (instEmail ? instEmail.split('@')[0] : '') ||
    String(c.instructor_name || '').trim()

  return {
    id: c.id,
    title: c.title || '',
    description: c.description || '',
    thumbnail: c.thumbnail_url || c.thumbnail || c.image || c.featured_image || null,
    thumbnail_url: c.thumbnail_url || c.thumbnail || null,
    price: priceValue,
    is_free: priceValue === 0,
    createdAt: c.created_at || c.createdAt || null,
    instructor_name: instName || null,
    // Handle disembunyikan kalau isinya sama dengan nama yang sudah tampil
    instructor_username: instUsername && instUsername !== instName ? instUsername : null,
    instructor_bio: String(inst?.bio || '').trim() || null,
    instructor_avatar: normalizeMediaUrl(inst?.profile_photo_url) || c.instructor_avatar || null,
    rate: c.rating_avg ?? c.rate ?? c.rating ?? null,
    totalRates: c.rating_count ?? c.totalRates ?? null,
    totalEnrolments: c.buyers_count ?? c.totalEnrolments ?? null,
    chapters: Array.isArray(c.chapters) ? c.chapters : null,
  }
}

const buildModulesFromChapters = (chapters) => {
  const list = Array.isArray(chapters) ? chapters : []
  return [...list]
    .sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0))
    .map((ch) => ({
      id: ch?.id,
      title: ch?.title || '',
      order_index: ch?.order ?? 0,
      lessons: Array.isArray(ch?.lessons) ? ch.lessons : [],
    }))
}

const mapLesson = (l, moduleId) => ({
  id: l?.id,
  title: l?.title || '',
  order_index: l?.order ?? l?.order_index ?? 0,
  duration: l?.duration_seconds != null ? Math.round(Number(l.duration_seconds) / 60) : (l?.duration ?? null),
  completed: Boolean(l?.is_completed || l?.completed),
  content: l?.content || null,
  video_url: l?.youtube_url || l?.video_url || null,
  module: moduleId,
})

const parseLessonsResponse = (data, fallbackChapters) => {
  const chaptersFromResponse = Array.isArray(data?.chapters) ? data.chapters : null

  if (chaptersFromResponse) {
    const mods = buildModulesFromChapters(chaptersFromResponse)
    const flat = mods.flatMap((m) =>
      [...(m.lessons || [])]
        .sort((a, b) => (a?.order ?? a?.order_index ?? 0) - (b?.order ?? b?.order_index ?? 0))
        .map((l) => mapLesson(l, m.id))
    )
    return { modules: mods, lessons: flat }
  }

  const list = Array.isArray(data) ? data : (Array.isArray(data?.results) ? data.results : [])
  if (!list.length) {
    const mods = buildModulesFromChapters(fallbackChapters)
    const flat = mods.flatMap((m) =>
      [...(m.lessons || [])]
        .sort((a, b) => (a?.order ?? a?.order_index ?? 0) - (b?.order ?? b?.order_index ?? 0))
        .map((l) => mapLesson(l, m.id))
    )
    return { modules: mods, lessons: flat }
  }

  const moduleMap = new Map()
  const ensureModule = (id, title, order) => {
    const key = id || 0
    if (!moduleMap.has(key)) {
      moduleMap.set(key, { id: key, title: title || '', order_index: order ?? 0, lessons: [] })
    }
    return moduleMap.get(key)
  }

  const mappedLessons = list.map((l) => {
    const chapterId = l?.chapter_id || l?.chapter || l?.chapter?.id || 0
    ensureModule(chapterId, l?.chapter_title || l?.chapter?.title || '', l?.chapter_order || l?.chapter?.order || 0)
    return mapLesson(l, chapterId)
  })

  const mods = [...moduleMap.values()].sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
  return { modules: mods, lessons: mappedLessons.sort((a, b) => (a.order_index || 0) - (b.order_index || 0)) }
}

const courseStats = computed(() => {
  const ratingRaw = Number(course.value?.rate ?? 0)
  // rating 0 = belum ada penilaian, bukan "nilainya nol"
  const rating = ratingRaw > 0 ? ratingRaw : null
  const ratingCount = Number(course.value?.totalRates ?? 0)
  const buyers = Number(course.value?.totalEnrolments ?? 0)
  const durationMinutes = lessons.value.reduce((sum, l) => sum + (Number(l?.duration ?? 0) || 0), 0)
  return { rating, ratingCount, buyers, durationMinutes }
})

const progressPercent = computed(() => {
  const total = lessons.value.length
  if (!total) return 0
  const done = lessons.value.filter((l) => l.completed).length
  return Math.round((done / total) * 100)
})

const completedCount = computed(() => lessons.value.filter((l) => l.completed).length)

const lessonsOf = (moduleId) =>
  lessons.value.filter((l) => l.module === moduleId || l.module?.id === moduleId)

onMounted(async () => {
  try {
    loading.value = true
    const courseId = route.params.courseId || route.query.courseId
    const lessonId = route.params.lessonId || route.query.lessonId
    const moduleId = route.params.moduleId || route.query.moduleId

    if (!isAuthenticated.value) {
      error.value = 'Anda belum login. Silakan login terlebih dahulu.'
      return
    }

    if (courseId) {
      const rawCourse = await loadCourseData(courseId)
      course.value = mapCourseFromApi(rawCourse) || rawCourse
      const fallbackChapters = Array.isArray(rawCourse?.chapters) ? rawCourse.chapters : null

      try {
        const { data } = await api.get(`/courses/my/lessons/${courseId}/`)
        const parsed = parseLessonsResponse(data, fallbackChapters)
        modules.value = parsed.modules
        lessons.value = parsed.lessons
      } catch (eLessons) {
        if (eLessons?.response?.status === 401) {
          error.value = 'Sesi Anda sudah berakhir. Silakan login kembali.'
          return
        }
        if (eLessons?.response?.status === 403) {
          error.value = 'Kursus ini belum Anda beli.'
          modules.value = []
          lessons.value = []
          return
        }
        const parsed = parseLessonsResponse([], fallbackChapters)
        modules.value = parsed.modules
        lessons.value = parsed.lessons
      }

      if (moduleId) {
        const found = modules.value.find((m) => m.id === parseInt(moduleId))
        if (found) {
          selectedModule.value = found
          modulesById.value[found.id] = found
          openModules.value.add(found.id)
        }
      }
      if (!selectedModule.value && modules.value.length) {
        selectedModule.value = modules.value[0]
        modulesById.value[selectedModule.value.id] = selectedModule.value
        openModules.value.add(modules.value[0].id)
      }

      currentLesson.value = lessonId
        ? (lessons.value.find((l) => l.id === parseInt(lessonId)) || lessons.value[0] || null)
        : (lessons.value[0] || null)

      await fetchQuestions(currentLesson.value?.id)
      recommendedCourses.value = await loadRecommendedCourses(courseId)
    } else {
      const dummy = dummyCourses[0]
      course.value = dummy
      modules.value = dummy.modules
      lessons.value = modules.value
        .flatMap((m) => (Array.isArray(m.lessons) ? m.lessons : []).map((l) => ({ ...l, module: m.id })))
        .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
      selectedModule.value = modules.value[0] || null
      if (selectedModule.value) openModules.value.add(selectedModule.value.id)
      currentLesson.value = lessons.value[0] || null
      await fetchQuestions(currentLesson.value?.id)
      recommendedCourses.value = dummyRecommendedCourses
    }
  } catch (e) {
    console.error('Error saat memuat halaman belajar:', e)
    error.value = 'Gagal memuat materi. Coba muat ulang halaman.'
  } finally {
    loading.value = false
  }
})

const toggleModule = (moduleId) => {
  if (openModules.value.has(moduleId)) openModules.value.delete(moduleId)
  else openModules.value.add(moduleId)
}

const selectLesson = (lesson) => {
  currentLesson.value = lesson
  playerActive.value = false
  completeError.value = null
  questionsError.value = null
  showAskSuccess.value = false
  showAskError.value = false
  askSuccessMessage.value = ''
  askError.value = null
  questionText.value = ''
  fetchQuestions(lesson?.id)

  const lessonModule = modules.value.find((m) =>
    lessons.value.some((l) => l.id === lesson.id && (l.module === m.id || l.module?.id === m.id))
  )
  if (lessonModule) {
    openModules.value.add(lessonModule.id)
    selectedModule.value = lessonModule
    modulesById.value[lessonModule.id] = lessonModule
  }

  router.replace({
    query: {
      ...route.query,
      moduleId: lessonModule?.id || selectedModule.value?.id,
      lessonId: lesson.id,
    },
  })
}

const completeLesson = async (lesson) => {
  if (!lesson?.id) return
  completeError.value = null
  if (!isAuthenticated.value) {
    router.push({ name: 'login', query: { redirect: route.fullPath } })
    return
  }
  if (lesson.completed) return

  completingLessonId.value = lesson.id
  try {
    const lid = Number(lesson.id)
    try {
      await api.post('/courses/lesson/complete/', { lesson_id: lid })
    } catch (e1) {
      const status = e1?.response?.status
      if (status && status >= 400 && status < 500) {
        try {
          await api.post('/courses/lesson/complete/', { id: lid })
        } catch (e2) {
          if (e2?.response?.status >= 400 && e2?.response?.status < 500) {
            await api.post('/courses/lesson/complete/')
          } else throw e2
        }
      } else throw e1
    }

    lessons.value = lessons.value.map((l) =>
      l.id === lesson.id ? { ...l, completed: true, is_completed: true } : l
    )
    if (currentLesson.value?.id === lesson.id) {
      currentLesson.value = { ...currentLesson.value, completed: true, is_completed: true }
    }
  } catch (e) {
    completeError.value =
      e.response?.data?.detail || e.response?.data?.message || 'Gagal menandai lesson selesai.'
  } finally {
    completingLessonId.value = null
  }
}

const formatDateTime = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return String(iso)
  return d.toLocaleString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const formatUserName = (u) => {
  if (!u) return 'User'
  if (typeof u === 'string') {
    const text = u.trim()
    if (text.startsWith('{') && text.endsWith('}')) {
      try {
        const parsed = JSON.parse(text)
        return parsed?.full_name || parsed?.username || parsed?.email || 'User'
      } catch {
        return text
      }
    }
    return text
  }
  if (typeof u === 'object') return u.full_name || u.username || u.email || 'User'
  return 'User'
}

const initialOf = (name) => String(name || '?').trim().charAt(0).toUpperCase()

const fetchQuestions = async (lessonId) => {
  if (!lessonId) {
    questions.value = []
    return
  }
  if (!isAuthenticated.value) return
  questionsLoading.value = true
  questionsError.value = null
  try {
    const { data } = await api.get(`/courses/lessons/${lessonId}/questions/`)
    questions.value = Array.isArray(data) ? data : (data?.results || [])
  } catch (e) {
    const status = e?.response?.status
    questionsError.value =
      status === 403 ? 'Anda belum membeli kursus ini.'
        : status === 401 ? 'Sesi berakhir. Silakan login kembali.'
        : 'Gagal memuat pertanyaan.'
    questions.value = []
  } finally {
    questionsLoading.value = false
  }
}

const submitQuestion = async () => {
  const lessonId = currentLesson.value?.id
  const text = String(questionText.value || '').trim()
  if (!lessonId || !text) return

  showAskSuccess.value = false
  showAskError.value = false
  askError.value = null

  if (!isAuthenticated.value) {
    router.push({ name: 'login', query: { redirect: route.fullPath } })
    return
  }

  asking.value = true
  try {
    const { data } = await api.post(`/courses/lessons/${lessonId}/questions/`, { question: text })
    questionText.value = ''
    askSuccessMessage.value = 'Pertanyaan berhasil dikirim.'
    showAskSuccess.value = true
    if (data) questions.value = [data, ...questions.value]
    else await fetchQuestions(lessonId)
  } catch (e) {
    askError.value = e
    showAskError.value = true
  } finally {
    asking.value = false
  }
}

// ===== Player =====
const playUrl = computed(() => currentLesson.value?.video_url || course.value?.video_url || null)
const youTubeId = computed(() => getYouTubeId(playUrl.value))
const isYouTube = computed(() => !!youTubeId.value)
const isVideoFile = computed(() => !!playUrl.value && !isYouTube.value)

const youtubeEmbedSrc = computed(() =>
  youTubeId.value
    ? `https://www.youtube-nocookie.com/embed/${youTubeId.value}?rel=0&modestbranding=1&playsinline=1&autoplay=1&iv_load_policy=3`
    : null
)

const activatePlayer = () => {
  if (playUrl.value) playerActive.value = true
}

const courseLink = (c) => `/course/${c.id || c.slug}`
const recThumb = (c) =>
  c.thumbnail_url || c.image || c.thumbnail || c.featured_image || recommendedCourse1Src
</script>

<template>
  <div class="w-full max-w-none mx-auto bg-white overflow-x-hidden">
    <AppHeader :is-authenticated="isAuthenticated" :user="auth.user" @logout="logout" />
    <SuccessModal :show="showAskSuccess" title="Berhasil" :message="askSuccessMessage" @close="showAskSuccess = false" />
    <ErrorModal :show="showAskError" title="Gagal Mengirim Pertanyaan" :error="askError" @close="showAskError = false" />

    <section id="main-content" class="pb-16">
      <!-- ===== Skeleton shimmer ===== -->
      <div v-if="loading" class="grid grid-cols-1 lg:grid-cols-[1fr_360px] w-full" aria-hidden="true">
        <div>
          <div class="w-full aspect-video shimmer-dark"></div>
          <div class="px-4 lg:px-16 py-6">
            <div class="h-8 lg:h-10 w-2/3 rounded-lg shimmer"></div>
            <div class="h-5 w-1/2 rounded shimmer mt-3"></div>
            <div class="h-10 w-40 rounded-lg shimmer mt-5"></div>
          </div>
          <div class="px-4 lg:px-16 pb-6 flex flex-wrap gap-4">
            <div class="h-20 w-64 rounded-2xl shimmer"></div>
            <div class="h-20 w-28 rounded-2xl shimmer"></div>
            <div class="h-20 w-28 rounded-2xl shimmer"></div>
            <div class="h-20 w-32 rounded-2xl shimmer"></div>
          </div>
          <div class="px-4 lg:px-16 pb-6">
            <div class="h-28 w-full rounded-2xl shimmer"></div>
          </div>
          <div class="px-4 lg:px-16 space-y-3">
            <div class="h-4 w-full rounded shimmer"></div>
            <div class="h-4 w-11/12 rounded shimmer"></div>
            <div class="h-4 w-10/12 rounded shimmer"></div>
            <div class="h-4 w-9/12 rounded shimmer"></div>
          </div>
          <div class="px-4 lg:px-16 mt-10">
            <div class="h-40 w-full rounded-2xl shimmer"></div>
          </div>
        </div>
        <aside class="hidden lg:block border-l border-gray-200 p-5">
          <div class="h-4 w-1/2 rounded shimmer"></div>
          <div class="h-2 w-full rounded-full shimmer mt-3"></div>
          <div class="mt-6 space-y-3">
            <div v-for="n in 3" :key="`sk-mod-${n}`">
              <div class="h-5 w-3/4 rounded shimmer"></div>
              <div class="h-12 w-full rounded-lg shimmer mt-2"></div>
              <div class="h-12 w-full rounded-lg shimmer mt-2"></div>
            </div>
          </div>
          <div class="h-48 w-full rounded-2xl shimmer mt-8"></div>
        </aside>
      </div>

      <!-- ===== Error ===== -->
      <div v-else-if="error" class="max-w-lg mx-auto my-20 px-6 text-center">
        <div class="mx-auto mb-4 flex items-center justify-center w-14 h-14 rounded-full bg-red-50 text-red-500">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="w-7 h-7">
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4" /><path d="M12 16h.01" />
          </svg>
        </div>
        <h2 class="font-montserrat text-lg font-bold mb-2">Tidak bisa membuka materi</h2>
        <p class="font-montserrat text-sm text-gray-600 mb-6">{{ error }}</p>
        <RouterLink to="/course" class="inline-block bg-[#009444] text-white rounded-lg px-5 py-2.5 font-montserrat font-semibold no-underline">
          Kembali ke Daftar Kursus
        </RouterLink>
      </div>

      <!-- ===== Konten ===== -->
      <div v-else-if="course" class="grid grid-cols-1 lg:grid-cols-[1fr_360px] w-full">
        <main class="min-w-0">
          <!-- Player -->
          <div class="relative bg-black w-full aspect-video overflow-hidden">
            <button
              v-if="!playerActive"
              type="button"
              class="absolute inset-0 w-full h-full group cursor-pointer border-0 p-0 bg-black"
              aria-label="Putar video"
              @click="activatePlayer"
            >
              <img
                :src="thumbnailSrc"
                alt=""
                class="w-full h-full object-cover opacity-85 transition-opacity duration-300 group-hover:opacity-70"
                @error="onThumbError"
              />
              <span class="absolute inset-0 flex items-center justify-center">
                <span class="flex items-center justify-center w-20 h-20 rounded-full bg-[#009444] shadow-2xl transition-transform duration-300 group-hover:scale-110">
                  <svg viewBox="0 0 24 24" fill="white" class="w-9 h-9 ml-1"><path d="M8 5v14l11-7z" /></svg>
                </span>
              </span>
              <span class="absolute bottom-4 left-4 right-4 text-left">
                <span class="block font-montserrat text-white text-base md:text-xl font-bold drop-shadow-lg line-clamp-2">
                  {{ currentLesson?.title || course.title }}
                </span>
                <span v-if="currentLesson?.duration" class="block font-montserrat text-white/80 text-xs md:text-sm mt-1 drop-shadow">
                  {{ formatLessonDuration(currentLesson.duration) }}
                </span>
              </span>
            </button>

            <template v-else>
              <iframe
                v-if="isYouTube"
                class="absolute inset-0 w-full h-full"
                :src="youtubeEmbedSrc"
                title="Pemutar video materi"
                frameborder="0"
                referrerpolicy="strict-origin-when-cross-origin"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
              ></iframe>
              <video v-else-if="isVideoFile" class="absolute inset-0 w-full h-full" :src="playUrl" controls controlsList="nodownload" disablePictureInPicture></video>

              <!-- Penahan klik: menutup area judul (atas) dan logo YouTube (kanan bawah) -->
              <template v-if="isYouTube">
                <div class="yt-guard yt-guard--top" aria-hidden="true"></div>
                <div class="yt-guard yt-guard--logo" aria-hidden="true"></div>
              </template>
            </template>
          </div>

          <!-- Judul & aksi -->
          <div class="px-4 lg:px-16 pt-6">
            <p class="font-montserrat text-xs font-bold uppercase tracking-wider text-[#009444] mb-1">
              {{ selectedModule?.title || 'Materi' }}
            </p>
            <h1 class="font-montserrat text-2xl lg:text-4xl font-bold text-gray-900 m-0 leading-tight">
              {{ course.title }}
            </h1>

            <div v-if="currentLesson" class="mt-3 flex flex-wrap items-center gap-3">
              <span class="font-montserrat text-base lg:text-lg font-medium text-gray-700">
                Lesson {{ String(currentLesson.order_index || 1).padStart(2, '0') }} — {{ currentLesson.title }}
              </span>
              <span
                v-if="currentLesson.completed"
                class="inline-flex items-center gap-1.5 bg-green-50 text-[#009444] rounded-full px-3 py-1 font-montserrat text-xs font-bold"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5">
                  <path d="m5 12 5 5L20 7" />
                </svg>
                Selesai
              </span>
            </div>

            <div v-if="currentLesson" class="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                class="inline-flex items-center gap-2 bg-[#009444] text-white border-0 rounded-lg px-5 py-2.5 cursor-pointer font-montserrat font-semibold transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="completingLessonId === currentLesson.id || currentLesson.completed"
                @click="completeLesson(currentLesson)"
              >
                <svg v-if="!currentLesson.completed" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
                  <path d="m5 12 5 5L20 7" />
                </svg>
                {{ currentLesson.completed ? 'Sudah Selesai' : (completingLessonId === currentLesson.id ? 'Memproses...' : 'Tandai Selesai') }}
              </button>
              <p v-if="completeError" class="m-0 font-montserrat text-sm text-red-600 font-semibold">{{ completeError }}</p>
            </div>
          </div>

          <!-- Instruktur ringkas + statistik -->
          <div class="px-4 lg:px-16 pt-6">
            <div class="flex flex-wrap items-stretch gap-3">
              <div class="flex items-center gap-3 bg-gradient-to-r from-[#009444] to-[#0a7a3c] text-white rounded-2xl px-4 py-3 min-w-[240px] flex-1 sm:flex-none">
                <img
                  v-if="course.instructor_avatar"
                  :src="course.instructor_avatar"
                  :alt="course.instructor_name || 'Instruktur'"
                  class="w-12 h-12 rounded-full object-cover shrink-0 ring-2 ring-white/40"
                />
                <span
                  v-else
                  class="flex items-center justify-center w-12 h-12 rounded-full bg-white/20 ring-2 ring-white/40 shrink-0 font-montserrat font-bold text-lg"
                >
                  {{ initialOf(course.instructor_name) }}
                </span>
                <span class="min-w-0">
                  <span class="block font-montserrat text-[10px] font-bold uppercase tracking-wider text-white/70">Instruktur</span>
                  <span class="block font-montserrat text-base font-bold truncate">
                    {{ course.instructor_name || 'Belum ditentukan' }}
                  </span>
                </span>
              </div>

              <div class="stat-card">
                <span class="stat-value">
                  {{ courseStats.rating != null ? Number(courseStats.rating).toFixed(1) : '—' }}
                  <svg v-if="courseStats.rating != null" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4 text-amber-400">
                    <path d="M12 2l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 17.1 6.1 20.2l1.2-6.6L2.5 9l6.6-.9z" />
                  </svg>
                </span>
                <span class="stat-label">{{ courseStats.ratingCount }} peringkat</span>
              </div>

              <div class="stat-card">
                <span class="stat-value">{{ courseStats.buyers }}</span>
                <span class="stat-label">Peserta</span>
              </div>

              <div class="stat-card">
                <span class="stat-value">{{ formatCourseDuration(courseStats.durationMinutes) }}</span>
                <span class="stat-label">Total durasi</span>
              </div>

              <div class="stat-card">
                <span class="stat-value">{{ progressPercent }}%</span>
                <span class="stat-label">{{ completedCount }}/{{ lessons.length }} lesson</span>
              </div>
            </div>
          </div>

          <!-- ===== Profil pengajar lengkap ===== -->
          <div v-if="course.instructor_name" class="px-4 lg:px-16 pt-6">
            <div class="rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-5 md:p-6">
              <p class="font-montserrat text-[11px] font-bold uppercase tracking-wider text-[#009444] m-0 mb-4">
                Pengajar Materi Ini
              </p>

              <div class="flex flex-col sm:flex-row gap-4">
                <div class="shrink-0">
                  <img
                    v-if="course.instructor_avatar"
                    :src="course.instructor_avatar"
                    :alt="course.instructor_name"
                    class="w-16 h-16 rounded-full object-cover ring-4 ring-white shadow-md bg-gray-100"
                    loading="lazy"
                  />
                  <div
                    v-else
                    class="w-16 h-16 rounded-full bg-[#009444]/10 text-[#009444] ring-4 ring-white shadow-md flex items-center justify-center font-montserrat text-xl font-bold"
                    aria-hidden="true"
                  >
                    {{ initialOf(course.instructor_name) }}
                  </div>
                </div>

                <div class="min-w-0 flex-1">
                  <h3 class="font-montserrat text-base md:text-lg font-bold text-gray-900 m-0 leading-snug">
                    {{ course.instructor_name }}
                  </h3>
                  <p v-if="course.instructor_username" class="font-montserrat text-xs text-gray-500 m-0 mt-0.5">
                    @{{ course.instructor_username }}
                  </p>

                  <p v-if="course.instructor_bio" class="font-montserrat text-sm text-gray-600 leading-relaxed m-0 mt-2.5">
                    {{ course.instructor_bio }}
                  </p>
                  <p v-else class="font-montserrat text-sm text-gray-400 italic m-0 mt-2.5">
                    Pengajar belum menambahkan deskripsi.
                  </p>

                  <div class="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3.5 pt-3.5 border-t border-gray-200">
                    <span class="inline-flex items-center gap-1.5 font-montserrat text-xs font-semibold text-gray-600">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 text-gray-400">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                      </svg>
                      {{ lessons.length }} lesson
                    </span>
                    <span v-if="courseStats.durationMinutes" class="inline-flex items-center gap-1.5 font-montserrat text-xs font-semibold text-gray-600">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 text-gray-400">
                        <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                      </svg>
                      {{ formatCourseDuration(courseStats.durationMinutes) }}
                    </span>
                    <span v-if="courseStats.buyers" class="inline-flex items-center gap-1.5 font-montserrat text-xs font-semibold text-gray-600">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 text-gray-400">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                      </svg>
                      {{ courseStats.buyers }} peserta
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Materi -->
          <article class="px-4 lg:px-16 pt-10 font-comfortaa text-[15px] font-medium leading-[30px] text-gray-800">
            <template v-if="currentLesson?.content">
              <div v-html="currentLesson.content" class="course-content"></div>
            </template>
            <template v-else-if="course.content">
              <div v-html="course.content" class="course-content"></div>
            </template>
            <template v-else-if="course.description">
              <p v-for="(paragraph, index) in course.description.split('\n\n')" :key="index" class="mb-4 last:mb-0">
                {{ paragraph }}
              </p>
            </template>
            <p v-else class="text-gray-400">Belum ada catatan materi untuk lesson ini.</p>
          </article>

          <!-- Q&A -->
          <section class="px-4 lg:px-16 pt-10">
            <div class="rounded-2xl border border-gray-200 p-5 md:p-6">
              <div class="flex items-center justify-between gap-3 mb-5">
                <h2 class="m-0 font-montserrat text-xl font-bold text-[#009444]">Tanya Jawab</h2>
                <span v-if="currentLesson" class="font-montserrat text-xs text-gray-500 font-semibold">
                  Lesson {{ String(currentLesson.order_index || 1).padStart(2, '0') }}
                </span>
              </div>

              <div v-if="!isAuthenticated" class="flex flex-wrap items-center justify-between gap-3">
                <p class="m-0 font-montserrat text-sm text-gray-600 font-semibold">Login dulu untuk bertanya.</p>
                <button
                  type="button"
                  class="bg-[#009444] text-white border-0 rounded-lg px-4 py-2 cursor-pointer font-montserrat font-semibold"
                  @click="router.push({ name: 'login', query: { redirect: route.fullPath } })"
                >
                  Login
                </button>
              </div>

              <div v-else class="flex flex-col gap-5">
                <form class="flex flex-col gap-3" @submit.prevent="submitQuestion">
                  <textarea
                    v-model="questionText"
                    class="w-full min-h-[92px] rounded-xl border border-gray-300 bg-gray-50 p-3.5 font-montserrat text-sm outline-none transition focus:bg-white focus:border-[#009444] focus:ring-2 focus:ring-[#009444]/20"
                    placeholder="Tulis pertanyaan tentang lesson ini..."
                    required
                  ></textarea>
                  <div class="flex items-center justify-end">
                    <button
                      type="submit"
                      class="bg-[#009444] text-white border-0 rounded-lg px-5 py-2.5 cursor-pointer font-montserrat font-semibold transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                      :disabled="asking || !currentLesson || !questionText.trim()"
                    >
                      {{ asking ? 'Mengirim...' : 'Kirim Pertanyaan' }}
                    </button>
                  </div>
                </form>

                <div v-if="questionsLoading" class="flex flex-col gap-3" aria-hidden="true">
                  <div v-for="n in 2" :key="`q-sk-${n}`" class="rounded-xl bg-gray-50 p-4">
                    <div class="flex items-center justify-between gap-3 mb-3">
                      <div class="h-4 w-32 rounded shimmer"></div>
                      <div class="h-3 w-24 rounded shimmer"></div>
                    </div>
                    <div class="h-4 w-full rounded shimmer"></div>
                    <div class="h-4 w-2/3 rounded shimmer mt-2"></div>
                  </div>
                </div>

                <p v-else-if="questionsError" class="m-0 font-montserrat text-sm text-red-600 font-semibold">
                  {{ questionsError }}
                </p>

                <div v-else class="flex flex-col gap-3">
                  <p v-if="questions.length === 0" class="m-0 font-montserrat text-sm text-gray-500">
                    Belum ada pertanyaan. Jadilah yang pertama bertanya.
                  </p>
                  <div v-for="q in questions" :key="q.id" class="rounded-xl bg-gray-50 p-4">
                    <div class="flex items-center gap-3 mb-2">
                      <span class="flex items-center justify-center w-8 h-8 rounded-full bg-[#009444]/10 text-[#009444] font-montserrat font-bold text-sm shrink-0">
                        {{ initialOf(formatUserName(q.user)) }}
                      </span>
                      <span class="min-w-0 flex-1">
                        <span class="block font-montserrat text-sm font-bold text-gray-900 truncate">{{ formatUserName(q.user) }}</span>
                        <span class="block font-montserrat text-[11px] text-gray-500">{{ formatDateTime(q.created_at) }}</span>
                      </span>
                    </div>
                    <p class="m-0 font-montserrat text-sm text-gray-800 leading-relaxed">{{ q.question }}</p>

                    <div v-if="q.answer" class="mt-3 border-l-4 border-[#009444] bg-white rounded-r-lg pl-3 pr-3 py-2">
                      <div class="flex items-center justify-between gap-3 mb-1">
                        <span class="font-montserrat text-xs text-[#009444] font-bold">
                          {{ q.answered_by ? formatUserName(q.answered_by) : (course.instructor_name || 'Pengajar') }}
                        </span>
                        <span class="font-montserrat text-[11px] text-gray-500">{{ formatDateTime(q.answered_at) }}</span>
                      </div>
                      <p class="m-0 font-montserrat text-sm text-gray-800 leading-relaxed">{{ q.answer }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>

        <!-- ===== Sidebar ===== -->
        <aside class="bg-white border-t lg:border-t-0 lg:border-l border-gray-200 min-w-0">
          <div class="p-5 lg:sticky lg:top-5">
            <div class="mb-6">
              <div class="flex items-baseline justify-between mb-2">
                <h2 class="m-0 font-montserrat text-sm font-bold text-gray-900">Progress Belajar</h2>
                <span class="font-montserrat text-sm font-bold text-[#009444]">{{ progressPercent }}%</span>
              </div>
              <div class="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                <div class="h-full rounded-full bg-[#009444] transition-all duration-500" :style="{ width: `${progressPercent}%` }"></div>
              </div>
              <p class="m-0 mt-2 font-montserrat text-xs text-gray-500">
                {{ completedCount }} dari {{ lessons.length }} lesson selesai
              </p>
            </div>

            <div class="flex flex-col gap-1.5">
              <div v-for="m in modules" :key="m.id" class="rounded-xl overflow-hidden border border-gray-200">
                <button
                  type="button"
                  class="w-full flex items-center justify-between gap-2 px-3.5 py-3 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer border-0 text-left"
                  :aria-expanded="openModules.has(m.id)"
                  @click="toggleModule(m.id)"
                >
                  <span class="min-w-0">
                    <span class="block font-montserrat text-[10px] font-bold uppercase tracking-wider text-[#009444]">
                      Bab {{ m.order_index || m.id }}
                    </span>
                    <span class="block font-montserrat text-sm font-bold text-gray-900 leading-snug">{{ m.title }}</span>
                    <span class="block font-montserrat text-[11px] text-gray-500 mt-0.5">
                      {{ lessonsOf(m.id).length }} lesson
                    </span>
                  </span>
                  <svg
                    viewBox="0 0 12 8"
                    fill="none"
                    class="w-3 h-2 shrink-0 text-[#009444] transition-transform duration-300"
                    :class="{ 'rotate-180': openModules.has(m.id) }"
                  >
                    <path d="M1 1L6 6L11 1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </button>

                <Transition name="accordion">
                  <ul v-if="openModules.has(m.id)" class="list-none m-0 p-1.5 flex flex-col gap-1 bg-white">
                    <li
                      v-for="(lesson, index) in lessonsOf(m.id)"
                      :key="`lesson-${lesson.id}`"
                      class="flex items-start gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-colors"
                      :class="lesson.id === currentLesson?.id ? 'bg-[#009444]/10' : 'hover:bg-gray-50'"
                      @click="selectLesson(lesson)"
                    >
                      <span
                        class="shrink-0 mt-0.5 w-4 h-4 rounded flex items-center justify-center transition-colors"
                        :class="lesson.completed ? 'bg-[#009444]' : (lesson.id === currentLesson?.id ? 'bg-[#009444]/30' : 'bg-gray-200')"
                      >
                        <svg v-if="lesson.completed" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" class="w-2.5 h-2.5">
                          <path d="m5 12 5 5L20 7" />
                        </svg>
                      </span>
                      <span class="min-w-0 flex-1">
                        <span class="block font-montserrat text-[11px] font-bold text-gray-500">Eps. {{ index + 1 }}</span>
                        <span
                          class="block font-montserrat text-[13px] font-semibold leading-snug"
                          :class="lesson.id === currentLesson?.id ? 'text-[#009444]' : 'text-gray-800'"
                        >
                          {{ lesson.title }}
                        </span>
                        <span class="block font-montserrat text-[11px] text-gray-400 mt-0.5">
                          {{ formatLessonDuration(lesson.duration) }}
                        </span>
                      </span>
                    </li>
                  </ul>
                </Transition>
              </div>
            </div>

            <div v-if="recommendedCourses.length" class="mt-8">
              <h2 class="m-0 mb-3 font-montserrat text-sm font-bold text-gray-900">Rekomendasi Kursus</h2>
              <div class="flex flex-col gap-3">
                <RouterLink
                  v-for="rec in recommendedCourses"
                  :key="`rec-${rec.id}`"
                  :to="courseLink(rec)"
                  class="group flex gap-3 items-center p-2 rounded-xl border border-gray-200 no-underline bg-white transition-all hover:border-[#009444]/40 hover:shadow-md"
                >
                  <span class="w-20 h-14 shrink-0 rounded-lg overflow-hidden bg-gray-100">
                    <img
                      :src="recThumb(rec)"
                      :alt="rec.title"
                      class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  </span>
                  <span class="min-w-0 flex-1">
                    <span class="block font-montserrat text-[13px] font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-[#009444] transition-colors">
                      {{ rec.title }}
                    </span>
                    <span class="block font-montserrat text-[11px] font-semibold text-[#009444] mt-1">
                      {{ Number(rec.price ?? 0) === 0 ? 'Gratis' : 'Lihat detail' }}
                    </span>
                  </span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 shrink-0 text-gray-300 group-hover:text-[#009444] transition-colors">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </RouterLink>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>

    <AppFooter :is-authenticated="isAuthenticated" :user="auth.user" @logout="logout" />
  </div>
</template>

<style scoped>
.shimmer,
.shimmer-dark {
  position: relative;
  overflow: hidden;
}
.shimmer { background-color: #e5e7eb; }
.shimmer-dark { background-color: #1f2937; }

.shimmer::after,
.shimmer-dark::after {
  content: '';
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  animation: shimmer 1.4s infinite;
}
.shimmer::after {
  background: linear-gradient(90deg, rgba(229,231,235,0) 0%, rgba(255,255,255,0.65) 50%, rgba(229,231,235,0) 100%);
}
.shimmer-dark::after {
  background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0) 100%);
}
@keyframes shimmer { 100% { transform: translateX(100%); } }

/* Penahan klik pada player YouTube: iframe milik domain lain, jadi isinya
   tidak bisa dimodifikasi. Dua lapisan transparan ini menutup area judul
   (atas) dan logo YouTube (kanan bawah). Kontrol dibiarkan bebas. */
.yt-guard {
  position: absolute;
  z-index: 5;
  background: transparent;
  cursor: default;
}
.yt-guard--top { top: 0; left: 0; right: 0; height: 62px; }
.yt-guard--logo { right: 0; bottom: 34px; width: 108px; height: 34px; }
@media (max-width: 640px) {
  .yt-guard--top { height: 46px; }
  .yt-guard--logo { bottom: 28px; width: 84px; height: 28px; }
}

.stat-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
  min-width: 104px;
  padding: 12px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  background: #fff;
  transition: border-color 0.2s;
}
.stat-card:hover { border-color: rgba(0, 148, 68, 0.35); }
.stat-value {
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: 'Montserrat', sans-serif;
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  line-height: 1.2;
}
.stat-label {
  font-family: 'Montserrat', sans-serif;
  font-size: 11px;
  font-weight: 500;
  color: #6b7280;
}

.accordion-enter-active,
.accordion-leave-active {
  transition: all 0.28s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}
.accordion-enter-from,
.accordion-leave-to { opacity: 0; max-height: 0; }
.accordion-enter-to,
.accordion-leave-from { opacity: 1; max-height: 900px; }

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@media (prefers-reduced-motion: reduce) {
  .shimmer::after,
  .shimmer-dark::after { animation: none; }
}
</style>

<style>
/* Konten materi dari CMS (v-html) — tidak scoped supaya style-nya kena */
.course-content h1 { font-family: 'Montserrat', sans-serif; font-size: 28px; font-weight: 700; margin: 24px 0 12px; }
.course-content h2 { font-family: 'Montserrat', sans-serif; font-size: 22px; font-weight: 700; margin: 20px 0 10px; }
.course-content h3 { font-family: 'Montserrat', sans-serif; font-size: 18px; font-weight: 700; margin: 16px 0 8px; }
.course-content p {
  font-family: 'Comfortaa', cursive;
  font-size: 15px;
  font-weight: 500;
  line-height: 30px;
  margin-bottom: 16px;
}
.course-content p:last-child { margin-bottom: 0; }
.course-content ul,
.course-content ol {
  font-family: 'Comfortaa', cursive;
  font-size: 15px;
  font-weight: 500;
  line-height: 30px;
  padding-left: 22px;
  margin-bottom: 16px;
}
.course-content ul { list-style-type: disc; }
.course-content ol { list-style-type: decimal; }
.course-content ul li { list-style-type: disc; }
.course-content a { color: #009444; text-decoration: underline; font-weight: 600; }
.course-content img { max-width: 100%; height: auto; border-radius: 12px; margin: 16px 0; }
</style>