<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { useRouter } from 'vue-router'
import AppHeader from '../../components/AppHeader.vue'
import AppFooter from '../../components/AppFooter.vue'
import CardArticle from './CardArticle.vue'
import Pagination from '../../components/Pagination.vue'
import ErrorState from '../../components/ErrorState.vue'
import { getAssetUrl } from '../../utils/assets'
import api from '../../services/api'

const auth = useAuthStore()
const router = useRouter()

const isAuthenticated = computed(() => auth.isAuthenticated)

const logout = () => {
  auth.logout()
  router.push('/')
}

const searchQuery = ref('')
const selectedCategory = ref('all')
const articles = ref([])
const featuredArticle = ref(null)
const loading = ref(false)
const initialLoading = ref(true)
const error = ref(null)
const categories = ref([])
const categoriesLoading = ref(false)
const categoriesError = ref(null)

// Pagination state
const currentPage = ref(1)
const itemsPerPage = ref(6)
const itemsPerPageOptions = [6, 9, 12, 18]

// Asset URLs
const heroBgSrc = getAssetUrl('caed016a7bbc5b74ccdcbbd46a6766b1ef87a658.png')
const heroLogoSrc = getAssetUrl('b352837f9c6525fe1f4bc0ce6aa884b855acf72a.png')
const searchIconSrc = getAssetUrl('901e6d8fbf9bd5d2fc8d48cc80a8b3f311da52bb.png')
const separatorSrc = getAssetUrl('93_262.svg')
const sliderBgSrc = getAssetUrl('f41da2f037ead28fdc9275891ada165102d6b7c0.png')
const sliderSeparatorSrc = getAssetUrl('320_110.svg')
const sliderArrowSrc = getAssetUrl('92cf44ce2f6d38054670790ecb1f964b5e1c121d.png')
const articlesBgSrc = getAssetUrl('1fc0d4fdf08dabc7e59b35987474afc4af53522b.png')
const starIconSrc = getAssetUrl('ae82f0fc275cc9614de9be18a7b57f7d24b16b0d.png')

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

// Sample article images
const articleImages = [
  getAssetUrl('ceca47a6478f603899f5b57003f9cb7368598bdd.png'),
  getAssetUrl('47bd4e96a9df80ad012c840c37d54dfb2bd7c046.png'),
  getAssetUrl('1eb5de3a3867ea93bd81861d06ccae3d18edf967.png'),
  getAssetUrl('daeb9afe8aebd8556996bfa0833246d5028a91c4.png'),
  getAssetUrl('fae23bb4188728f84d6eb8c1388ad51a8488ffac.png'),
  getAssetUrl('6ae8f60de6196d73aa8e6441c6e3a837b224c3f5.png'),
  getAssetUrl('e4a0fde3a8b6832804f26c192f6ec0fa5b9fdde0.png'),
  getAssetUrl('dc8c70d864fbc639c57ce585213f123e7eb6c25c.jpeg'),
  getAssetUrl('a28b322c5ab02c6290e1d019613d5afc85daf328.png'),
]

onMounted(async () => {
  try {
    categoriesLoading.value = true
    try {
      const { data } = await api.get('/posts/categories/')
      categories.value = Array.isArray(data) ? data : (data?.results || [])
    } catch (e) {
      categoriesError.value = e.message || 'Gagal memuat kategori'
      categories.value = []
    } finally {
      categoriesLoading.value = false
    }

    await fetchPosts()
  } catch (e) {
    error.value = e.message || 'Gagal memuat data'
    articles.value = []
    featuredArticle.value = null
    categories.value = []
  } finally {
    setTimeout(() => {
      initialLoading.value = false
    }, 250)
  }
})

const toDisplayDate = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return String(iso)
  return d.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })
}

const mapPostToCard = (p, index) => ({
  id: p?.id,
  title: p?.title || '',
  excerpt: p?.excerpt || '',
  thumbnail: normalizeMediaUrl(p?.thumbnail_url || p?.thumbnail) || null,
  author: p?.author || null,
  category: p?.category || null,
  date: toDisplayDate(p?.published_at || p?.created_at),
  comments: p?.comments_count || 0,
  rating: p?.rating || 4.8,
  imageIndex: index % articleImages.length,
  contentType: 'post',
  slug: p?.slug || null,
})

const fetchPosts = async () => {
  loading.value = true
  error.value = null
  try {
    const params = {}
    const cat = selectedCategory.value
    const q = String(searchQuery.value || '').trim()
    if (cat && cat !== 'all') params.category = cat
    if (q) params.search = q
    const { data } = await api.get('/posts/', { params })
    const list = Array.isArray(data) ? data : (data?.results || [])
    articles.value = list.map(mapPostToCard)
    featuredArticle.value = articles.value[0] || null
  } catch (e) {
    error.value = e
    articles.value = []
    featuredArticle.value = null
  } finally {
    loading.value = false
  }
}

let searchDebounceId = null
watch([selectedCategory, searchQuery], () => {
  currentPage.value = 1
  if (searchDebounceId) clearTimeout(searchDebounceId)
  searchDebounceId = setTimeout(() => {
    fetchPosts()
  }, 300)
})

const handleSearch = (e) => {
  e.preventDefault()
  currentPage.value = 1
  fetchPosts()
}

const categoriesMapById = computed(() => {
  const map = {}
  for (const cat of categories.value) {
    map[cat.id] = cat
  }
  return map
})

const getCategorySlugById = (id) => {
  return categoriesMapById.value[id]?.slug || ''
}

const displayCategoryName = (category) => {
  if (category && typeof category === 'object') {
    return category.name || 'Article'
  }
  if (typeof category === 'number') {
    return categoriesMapById.value[category]?.name || 'Article'
  }
  return category || 'Article'
}

const filteredArticles = computed(() => articles.value)
const filteredPosts = computed(() => [])

const getCategoryColor = (category) => {
  let value = category
  if (value && typeof value === 'object') {
    value = value.slug || value.name || ''
  }
  if (typeof category === 'number') {
    const cat = categoriesMapById.value[category]
    value = cat?.slug || cat?.name || ''
  }
  if ((value || '').toLowerCase() === 'perempuan') {
    return 'var(--accent-pink)'
  }
  return 'var(--accent-green)'
}

// Combine articles and posts for pagination
const allContent = computed(() => {
  const articlesWithType = filteredArticles.value.map(article => ({ ...article, contentType: 'post' }))
  return [...articlesWithType]
})

// Paginated content
const totalPages = computed(() => Math.ceil(allContent.value.length / itemsPerPage.value))
const paginatedContent = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return allContent.value.slice(start, end)
})

// Pagination handlers
const updateCurrentPage = (page) => {
  currentPage.value = page
}

const updateItemsPerPage = (newItemsPerPage) => {
  itemsPerPage.value = newItemsPerPage
  currentPage.value = 1 // Reset to first page
}


</script>

<template>
  <div class="min-h-screen relative">

    <!-- ===== Skeleton awal load: header + hero ===== -->
    <transition name="skeleton-fade">
      <div v-if="initialLoading" class="fixed inset-0 z-[9998] bg-white overflow-hidden" aria-hidden="true">
        <!-- Header skeleton -->
        <div class="h-20 px-4 md:px-9 flex items-center justify-between border-b border-gray-100">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 md:w-12 md:h-12 rounded-full shimmer"></div>
            <div class="h-5 md:h-6 w-32 md:w-44 rounded shimmer"></div>
          </div>
          <div class="hidden md:flex items-center gap-6">
            <div class="h-4 w-24 rounded shimmer"></div>
            <div class="h-4 w-24 rounded shimmer"></div>
            <div class="h-4 w-20 rounded shimmer"></div>
            <div class="h-4 w-20 rounded shimmer"></div>
          </div>
          <div class="h-10 w-20 md:w-24 rounded-lg shimmer"></div>
        </div>

        <!-- Hero skeleton -->
        <div class="pt-16 md:pt-24 px-4 max-w-[1440px] mx-auto">
          <div class="flex items-center justify-center gap-4 md:gap-6 mb-6">
            <div class="w-12 md:w-24 h-12 md:h-24 rounded-full shimmer"></div>
            <div class="h-7 md:h-12 w-56 md:w-[520px] rounded shimmer"></div>
          </div>
          <div class="mx-auto max-w-3xl h-10 md:h-14 rounded-full shimmer mb-8"></div>
          <div class="flex items-center justify-center gap-4 mb-6">
            <div class="h-4 w-14 rounded shimmer"></div>
            <div class="h-4 w-20 rounded shimmer"></div>
            <div class="h-4 w-20 rounded shimmer"></div>
          </div>
          <div class="mx-auto max-w-[1100px] h-[240px] md:h-[420px] rounded-2xl shimmer"></div>
        </div>
      </div>
    </transition>

    <AppHeader :is-authenticated="isAuthenticated" :user="auth.user" @logout="logout" />

    <section id="hero" class="relative pt-24 pb-16 text-center overflow-hidden">
      <div class="absolute inset-x-0 -top-20 h-[412px] -z-10 overflow-hidden scale-y-[-1]">
        <img :src="heroBgSrc" alt="Hero background" class="w-full h-full object-cover" />
      </div>

      <div class="max-w-[1440px] mx-auto px-4">
        <div class="flex items-center justify-center gap-6 mb-6">
          <img :src="heroLogoSrc" alt="ByzanPost Logo" class="w-12 md:w-16 lg:w-24" />
          <h1 class="text-lg md:text-4xl lg:text-6xl font-semibold text-start">ByzanPost News & Article</h1>
        </div>

        <form class="mx-auto max-w-3xl relative mb-8" @submit.prevent="handleSearch">
          <input
            type="text"
            placeholder="Search"
            v-model="searchQuery"
            class="w-full h-10 md:h-12 lg:h-14 rounded-full border border-gray-300 px-3 md:px-6 pr-20 text-md md:text-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button type="submit" class="absolute right-3 top-1/2 -translate-y-1/2 w-6 md:w-10 flex items-center justify-center">
            <img :src="searchIconSrc" alt="Search Icon" class="w-full h-full object-contain"/>
          </button>
        </form>

        <nav class="flex items-center justify-center gap-4 text-sm md:text-base font-medium uppercase text-primary mb-2 flex-wrap">
          <button class="py-1" @click="selectedCategory = 'all'">All</button>
          <span class="hidden md:inline">|</span>
          <template v-for="(cat, index) in categories" :key="cat.slug">
            <div class="flex items-center justify-center gap-4">
              <button
                @click="selectedCategory = cat.slug"
                :class="cat.color === 'pink' ? 'text-pink-500 py-1' : 'py-1'"
              >
                {{ cat.name }}
              </button>
              <span v-if="index !== categories.length - 1" class="md:inline">|</span>
            </div>
          </template>
        </nav>
        <div v-if="categoriesLoading" class="text-center text-sm text-gray-600">Memuat kategori...</div>
        <!-- <div v-if="categoriesError" class="text-center text-sm text-red-600">Terjadi kesalahan memuat kategori</div> -->

        <img :src="separatorSrc" alt="Separator" class="w-full max-w-full mt-4" />

        <div class="relative mt-4 mx-auto max-w-[1100px] rounded-2xl overflow-hidden shadow-lg flex items-center justify-start h-[340px] md:h-[460px]">
          <div v-if="loading" class="absolute inset-0 shimmer"></div>
          <img v-else :src="sliderBgSrc" alt="Featured article background" class="absolute inset-0 w-full h-full object-cover" />
          <!-- Gradient scrim biar teks card kebaca & gambar lebih berdimensi -->
          <div class="absolute inset-0 bg-gradient-to-r from-black/50 via-black/10 to-transparent pointer-events-none"></div>
          <div v-if="loading" class="mx-8 md:mx-12 lg:mx-16 bg-white/90 backdrop-blur-md shadow-lg w-[85%] md:w-[45%] p-4 md:p-6 rounded-xl text-left z-10">
            <div class="h-7 md:h-9 w-3/4 rounded shimmer"></div>
            <div class="h-1 w-full my-4 rounded shimmer"></div>
            <div class="h-4 w-full rounded shimmer"></div>
            <div class="h-4 w-5/6 rounded shimmer mt-2"></div>
            <div class="h-4 w-2/3 rounded shimmer mt-2"></div>
          </div>
          <div v-else-if="featuredArticle" class="mx-8 md:mx-12 lg:mx-16 bg-white/90 backdrop-blur-md shadow-lg w-[85%] md:w-[45%] p-4 md:p-6 rounded-xl text-left z-10">
            <h2 class="text-xl md:text-2xl lg:text-3xl font-bold text-primary line-clamp-3" v-html="featuredArticle.title || 'Featured Article'"></h2>
            <img :src="sliderSeparatorSrc" alt="Separator" class="w-full my-4" />
            <p class="text-sm md:text-base text-gray-700 line-clamp-3">{{ featuredArticle.excerpt || 'Article excerpt...' }}</p>
          </div>
          <button class="cursor-pointer absolute z-20 left-3 md:left-5 top-1/2 -translate-y-1/2 rotate-180 w-11 md:w-14 h-11 md:h-14 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-md transition-colors" type="button" aria-label="Previous">
            <img :src="sliderArrowSrc" alt="Previous" class="w-6 md:w-8" />
          </button>
          <button class="cursor-pointer absolute z-20 right-3 md:right-5 top-1/2 -translate-y-1/2 w-11 md:w-14 h-11 md:h-14 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-md transition-colors" type="button" aria-label="Next">
            <img :src="sliderArrowSrc" alt="Next" class="w-6 md:w-8" />
          </button>
        </div>
      </div>
    </section>

    <section id="articles" class="relative py-16">
      <div class="absolute inset-0 bg-cover bg-center" :style="{ backgroundImage: `url('${articlesBgSrc}')` }"></div>
      <div class="max-w-[1440px] mx-auto px-4 relative z-10">
        <div class="prose max-w-none mb-12 text-justify">
          <p class="inline font-bold text-3xl">ByzanPost </p>
          <p class="text-base md:text-lg inline"> adalah fitur media publikasi dari ByzanEdu yang menyajikan berita, artikel, dan kajian ilmiah seputar dunia pendidikan, filsafat, ekonomi, budaya, dan keislaman. Melalui ByzanPost, pembaca dapat memperluas wawasan intelektual dan spiritual melalui tulisan-tulisan yang inspiratif, analitis, dan berbasis riset.</p>
        </div>

        <!-- Error state -->
        <ErrorState
          v-if="error && !loading && paginatedContent.length === 0"
          :error="error"
          :loading="loading"
          @retry="fetchPosts"
        />

        <div v-else class="mb-6">
          <!-- Loading skeleton -->
          <div v-if="loading" class="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-8">
            <div v-for="n in itemsPerPage" :key="`art-skel-${n}`" class="rounded-2xl overflow-hidden bg-white border border-gray-200">
              <div class="h-52 shimmer"></div>
              <div class="p-5">
                <div class="h-5 w-3/4 rounded shimmer"></div>
                <div class="h-3 w-full rounded shimmer mt-3"></div>
                <div class="h-3 w-2/3 rounded shimmer mt-2"></div>
              </div>
              <div class="px-5 py-4 border-t border-gray-100 flex justify-between">
                <div class="h-4 w-1/2 rounded shimmer"></div>
                <div class="h-4 w-10 rounded shimmer"></div>
              </div>
            </div>
          </div>

          <!-- Content Grid -->
          <div v-else class="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-8">
            <CardArticle
              v-for="content in paginatedContent"
              :key="`${content.contentType}-${content.id}`"
              :article="content"
              :article-images="articleImages"
              :display-category-name="displayCategoryName"
              :get-category-color="getCategoryColor"
              :is-post="content.contentType === 'post'"
            />
          </div>
          <div v-if="!loading && !error && paginatedContent.length === 0" class="text-center text-gray-600 font-medium py-10">
            Belum ada artikel.
          </div>

          <!-- Pagination -->
          <div v-if="!loading && totalPages > 1" class="flex justify-center mb-8">
            <Pagination
              :currentPage="currentPage"
              :totalPages="totalPages"
              :itemsPerPage="itemsPerPage"
              :itemsPerPageOptions="itemsPerPageOptions"
              @update:currentPage="updateCurrentPage"
              @update:itemsPerPage="updateItemsPerPage"
            />
          </div>
        </div>
      </div>
    </section>

    <AppFooter :is-authenticated="isAuthenticated" :user="auth.user" @logout="logout" />
  </div>
</template>

<style scoped>
.skeleton-fade-leave-active {
  transition: opacity 0.4s ease;
}
.skeleton-fade-leave-to {
  opacity: 0;
}

.shimmer {
  position: relative;
  overflow: hidden;
  background-color: #e5e7eb;
}
.shimmer::after {
  content: '';
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, rgba(229,231,235,0) 0%, rgba(255,255,255,0.6) 50%, rgba(229,231,235,0) 100%);
  animation: shimmer 1.4s infinite;
}
@keyframes shimmer { 100% { transform: translateX(100%); } }

@media (prefers-reduced-motion: reduce) {
  .shimmer::after { animation: none; }
}
</style>