<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { useRouter } from 'vue-router'
import AppHeader from '../../components/AppHeader.vue'
import AppFooter from '../../components/AppFooter.vue'
import { getAssetUrl } from '../../utils/assets'
import CourseCard from '../../components/CourseCard.vue'
import ErrorState from '../../components/ErrorState.vue'
import Pagination from '../../components/Pagination.vue'
import GetKitabPopup from '../../components/GetKitabPopup.vue'
import RegisterModal from '../../components/RegisterModal.vue'
import Login from '../auth/Login.vue'
import api from '../../services/api'


const auth = useAuthStore()
const router = useRouter()
const showGetKitab = ref(false)
const showRegisterModal = ref(false)
const showLoginModal = ref(false)

const isAuthenticated = computed(() => auth.isAuthenticated)

const logout = () => {
  auth.logout()
  router.push('/')
}

const handleHeroCta = () => {
  if (isAuthenticated.value) {
    router.push({ name: 'my-courses' })
    return
  }
  showRegisterModal.value = true
}

const heroCtaLabel = computed(() => isAuthenticated.value ? 'Lihat Kursus Saya' : 'Daftar Sekarang')

const handleOpenLogin = () => {
  showRegisterModal.value = false
  showLoginModal.value = true
}

const handleOpenRegister = () => {
  showLoginModal.value = false
  showRegisterModal.value = true
}

// Asset URLs
const backgroundBgSrc = getAssetUrl('e442713b824b15e5170c7b2d90c87e437b6618d8.jpeg')
const backgroundGradientSrc = getAssetUrl('1546614f57dbcbddaad5b7f9eda092ce3f610db4.png')
const backgroundGridSrc = getAssetUrl('70_1222.svg')
const arrowSrc = getAssetUrl('arrow.png')


const videoThumbSrc = getAssetUrl('5bd5c69c68fe54919744198aea008ec38c5ccf96.png')
const bookImageSrc = getAssetUrl('a515fb95f69fc22e9c12d01001c565d7f22f182c.png')
const aboutLinesSrc = getAssetUrl('70_1448.svg')
const aboutGradientSrc = getAssetUrl('1546614f57dbcbddaad5b7f9eda092ce3f610db4.png')
const paperPlaneSrc = getAssetUrl('15f47f71f80b6474e00a66edd9fef321a837f795.png')
const aboutCharacterSrc = getAssetUrl('135990b854fe6a0216e8ec2a2e419e564a2b7685.png')
const aboutLogoSrc = getAssetUrl('e5953eaab12a20f86febfa843fd39a247183b510.png')

// Fetch courses from API
const courses = ref([])
const loadingCourses = ref(false)
const initialLoading = ref(true)
const coursesError = ref(null)

const formatPrice = (price) => {
  const value = Number(price ?? 0)
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value)
}

const mapApiCourseToCard = (c) => {
  const priceValue = Number(c?.price ?? 0)
  return {
    id: c?.id,
    title: c?.title ?? '',
    description: c?.description ?? c?.excerpt ?? '',
    thumbnail: c?.thumbnail_url || c?.thumbnail || '',
    price: priceValue,
    is_free: priceValue === 0,
    createdAt: c?.created_at || c?.createdAt || new Date().toISOString(),
    rate: c?.rating_avg ?? c?.rate ?? null,
    instructor_name: c?.instructor_name ?? '',
    is_enrolled: Boolean(c?.is_enrolled),
    total_lessons: c?.total_lessons ?? 0,
  }
}

// Pagination state
const currentPage = ref(1)
const itemsPerPage = ref(8)
const itemsPerPageOptions = [4, 8, 12, 16]

const fetchCourses = async () => {
  loadingCourses.value = true
  coursesError.value = null
  try {
    const { data } = await api.get('/courses/')
    const list = Array.isArray(data) ? data : []
    courses.value = list.map(mapApiCourseToCard)
  } catch (err) {
    coursesError.value = err
    courses.value = []
  } finally {
    loadingCourses.value = false
  }
}

onMounted(async () => {
  await fetchCourses()
  // beri jeda singkat supaya transisi shimmer -> konten terasa mulus
  setTimeout(() => {
    initialLoading.value = false
  }, 250)
})

const featuredCourse = computed(() => courses.value[0] || null)
const featuredInstructorName = computed(() => featuredCourse.value?.instructor_name || '-')
const featuredThumbnail = computed(() => featuredCourse.value?.thumbnail || videoThumbSrc)
const topHeroCourses = computed(() => courses.value.slice(0, 3))

const popularCourses = computed(() => courses.value.slice(0, 8))

// Paginated courses
const totalPages = computed(() => Math.ceil(courses.value.length / itemsPerPage.value))
const paginatedCourses = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return courses.value.slice(start, end)
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
  <div class="w-full max-w-full mx-auto relative bg-white overflow-x-clip">

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
          <div class="md:hidden h-6 w-7 rounded shimmer"></div>
        </div>

        <!-- Hero skeleton -->
        <div class="pt-10 px-4 md:px-0">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-0">
            <!-- Video card -->
            <div class="bg-[#F5F5F5] rounded-4xl lg:rounded-[52px] p-6 md:translate-x-10 xl:translate-x-20">
              <div class="w-full aspect-video rounded-3xl lg:rounded-[40px] shimmer"></div>
            </div>
            <!-- Headline card -->
            <div class="h-fit w-auto md:w-[90%] md:aspect-video bg-[#F5F5F5] rounded-4xl lg:rounded-[52px] p-6 md:translate-y-1/3 xl:translate-y-1/2 md:-translate-x-10 md:ps-20 xl:ps-40 flex flex-col justify-center">
              <div class="h-7 md:h-9 w-3/4 rounded shimmer"></div>
              <div class="h-7 md:h-9 w-2/3 rounded shimmer mt-2"></div>
              <div class="h-7 md:h-9 w-1/2 rounded shimmer mt-2"></div>
              <div class="h-4 w-3/5 rounded shimmer mt-4"></div>
              <div class="h-9 w-36 rounded-[18.6px] shimmer mt-5"></div>
            </div>
          </div>

          <!-- Hero course cards skeleton -->
          <div class="flex flex-wrap gap-5 mx-0 md:mx-10 lg:mx-20 py-10 mt-6 md:mt-24">
            <div v-for="n in 3" :key="`hero-skel-${n}`" class="w-full md:w-[200px] bg-gray-100 rounded-[18.3px] p-[9px] flex flex-col items-center">
              <div class="w-full md:w-[182px] h-[114px] rounded-[18.3px] shimmer"></div>
              <div class="h-5 w-3/4 rounded shimmer mt-3"></div>
              <div class="h-3 w-1/2 rounded shimmer mt-2"></div>
            </div>
          </div>
        </div>
      </div>
    </transition>

<AppHeader :is-authenticated="isAuthenticated" :user="auth.user" @logout="logout" />

    <section class="pt-10 relative overflow-x-clip" id="hero">
      <!-- Background Images with proper layering -->

      <div class="absolute top-10 right-0 w-[400px] h-[400px] md:w-[800px] md:h-[800px] pointer-events-none gradient-blob-1"></div>
      <div class="absolute top-[250px] right-[100px] w-[350px] h-[350px] md:w-[700px] md:h-[700px] pointer-events-none gradient-blob-2 animate-sway"></div>
      <img :src="paperPlaneSrc" alt="paper plane" class="hidden md:block absolute bottom-0 right-[40%] w-[100px] h-auto object-cover object-center z-1 scale-x-[-1] animate-float-slow rotate-12 animate-float"/>
      <img 
        :src="backgroundBgSrc" 
        alt="background" 
        class="absolute top-0 left-0 pointer-events-none select-none -z-1 opacity-100"
        style="height: 500px;"
        @error="console.error('Failed to load background image:', backgroundBgSrc)"
      />
      <img 
        :src="backgroundGradientSrc" 
        alt="background gradient" 
        class="absolute top-0 left-0 pointer-events-none select-none z-0 opacity-100 animate-gradient-pulse max-w-none"
        style="width: 2882px; height: 1922px; transform: translate(-834px, -198px);"
        @error="console.error('Failed to load gradient image:', backgroundGradientSrc)"
      />
      <img 
        :src="backgroundGridSrc" 
        alt="background grid" 
        class="absolute top-0 left-0 pointer-events-none select-none z-0 opacity-100"
        @error="console.error('Failed to load grid image:', backgroundGridSrc)"
        @load="console.log('Grid image loaded:', backgroundGridSrc)"
      />

      <div class="grid grid-cols-1 md:grid-cols-2 relative z-1">
        <div class="bg-[#F5F5F5] rounded-4xl lg:rounded-[52px] p-6 mx-4 md:mx-0 md:translate-x-10 xl:translate-x-20 z-1">
          <div class="relative overflow-hidden">
            <img :src="featuredThumbnail" alt="Course video thumbnail" class="w-full aspect-video object-cover rounded-3xl lg:rounded-[40px]" />
            <div class="absolute bottom-0 left-0">
              <div class="relative text-white px-8 py-2">
              </div>
            </div>
          </div>          
        </div>

        <div class="h-fit w-auto md:w-[90%] mx-4 md:mx-0 mt-6 md:mt-0 md:aspect-video bg-[#F5F5F5] rounded-4xl lg:rounded-[52px] p-6 md:translate-y-1/3 xl:translate-y-1/2 md:-translate-x-10 lxl:-translate-x-20  md:ps-20 xl:ps-40 relative">
         <div class="flex flex-col justify-center h-full z-0">
           <h1 class="text-xl md:texl-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl font-bold text-green-600 leading-[1.18] m-0 font-montserrat">
            Khatam Belajar<br />
            Ilmu <strong class="font-extrabold">Jurumiyah</strong><br />
            dalam 8 Sesi
          </h1>
          
          <p class="text-sm md:text-lg lg:text-xl font-semibold mt-1 lg:mt-3 ml-0.5 font-montserrat">Kursus mudah dengan metode Mesir</p>
          <button @click="handleHeroCta" class="inline-flex self-start items-center justify-center px-3 py-1 lg:px-6 lg:py-2 rounded-[18.6px] font-semibold cursor-pointer border-0 no-underline font-montserrat transition-opacity duration-200 hover:opacity-80 bg-black text-white mt-2 md:mt-4 lg:mt-6 ">
            <span class="text-white md:text-sm lg:text-base">{{ heroCtaLabel }}</span>
          </button>
         </div>
        </div>
        <div class="flex flex-row md:hidden gap-4 items-center justify-center mx-4 mt-6 z-0">
          <img :src="bookImageSrc" alt="Jurumiyah book" class="w-[90px] shrink-0" />
          <button @click="showGetKitab=true" class="inline-flex items-center justify-center px-5 py-2.5 rounded-[18.6px] font-semibold cursor-pointer border-0 no-underline font-montserrat transition-opacity duration-200 hover:opacity-80 bg-black text-white relative">
            <span class="text-white text-sm">Dapatkan Kitab</span>
          </button>
        </div>
      </div>
       <div class="md:absolute top-5 md:right-10 lg:right-[10%] xl:right-[15%] gap-8 md:items-start xl:items-center hidden md:flex">
          <img :src="bookImageSrc" alt="Jurumiyah book" class="md:w-[150px] xl:w-[200px] z-0" />
          <button @click="showGetKitab=true" class="inline-flex items-center justify-center md:mt-5 xl:mt-20 px-6 py-2 rounded-[18.6px] font-semibold cursor-pointer border-0 no-underline font-montserrat transition-opacity duration-200 hover:opacity-80 bg-black text-white relative  text-[17.7px] z-1">
            <span class="text-white">Dapatkan Kitab</span>
          </button>
        </div>

      <div class="w-auto md:w-fit flex flex-wrap gap-4 md:gap-5 z-3 mx-4 md:mx-10 lg:mx-20 py-10 relative md:border-b-4  border-gray-200">
        <RouterLink
          v-for="course in topHeroCourses"
          :key="`hero-${course.id}`"
          :to="`/course/${course.id}`"
          class="w-full min-w-0 max-w-full md:w-[200px] bg-gray-100 rounded-[18.3px] backdrop-blur-[10px] shadow-[4.2px_3.5px_9px_0px_rgba(0,0,0,0.05)] text-center p-[9px] flex flex-col items-center"
        >
          <div class="w-full md:w-[182px] aspect-[182/114] md:h-[114px] md:aspect-auto rounded-[18.3px] overflow-hidden shadow-[inset_1.7px_1.4px_1.4px_0px_rgba(255,255,255,0.25)]">
            <img v-if="course.thumbnail" :src="course.thumbnail" :alt="course.title" class="w-full h-full object-cover" />
            <div v-else class="w-full h-full bg-gray-200"></div>
          </div>
          <h4 class="w-full text-lg md:text-[22.4px] font-bold text-green-600 my-2 font-montserrat line-clamp-2 break-words">{{ course.title }}</h4>
          <p class="text-xs md:text-[8.9px] font-semibold m-0 font-montserrat text-gray-600">{{ course.is_free ? 'Click Here For Free Course' : formatPrice(course.price) }}</p>
        </RouterLink>
      </div>
    </section>
<section class="relative lg:min-h-screen flex gap-10 overflow-visible pt-12 md:pt-20" id="about">
    <img :src="aboutLinesSrc" alt="background lines" class=" absolute -top-[15%] w-[125%] right-[17%] z-1 object-cover object-center animate-drift" >
    <img :src="aboutGradientSrc" alt="background gradient" class="absolute z-0 block min-w-full min-h-full object-cover object-center animate-gradient-pulse max-w-none" style="width: 2882px; height: 1922px; top: -242px; right: 0; transform: rotate(180deg);">

    
    <div class="z-1 w-0 md:w-[10%] lg:w-[20%] h-full">
        <img :src="aboutCharacterSrc" alt="3D character mascot" class=" mt-32 -mx-2 absolute bottom-0 w-[20%] h-auto object-cover object-center">
        <div class="absolute bottom-[5%] lg:bottom-[10%] left-[20%] lg:right-0 flex items-center gap-2 text-white text-[22.2px] font-semibold">
            <img :src="arrowSrc" alt="arrow" class="w-[30px] md:w-[50px] lg:w-[100px] h-auto mb-2">
            <span class="pt-4">NOVEL</span>
        </div>
    </div>

    <div class="relative w-full md:w-[80%] lg:w-[70%] h-fit z-1 bg-black/20 rounded-[54px] rounded-br-none backdrop-blur-[3px] shadow-[0px_4px_4px_0px_rgba(255,255,255,0.25)] text-white p-4 md:p-8 lg:p-10 mx-4 md:mx-0 mb-10 md:mb-0">
        <p class=" font-comfortaa text-sm md:text-lg lg:text-xl font-semibold leading-normal md:leading-[1.7] lg:leading-loose text-justify max-w-[980px]">
            <span class="inline-flex me-4">
              <img :src="aboutLogoSrc" alt="ByzanCourse Logo" class="w-[72px] h-[58px]">
            </span>
            <span class="text-2xl md:text-3xl lg:text-5xl font-medium m-0 p-0 font-montserrat"><span class="font-extrabold">Byzan</span>Course</span>
            adalah platform pembelajaran Islam online yang dirancang untuk membantu siapa saja — dari pemula hingga pelajar berpengalaman — memahami ilmu agama secara bertahap, terstruktur, dan mudah diakses.
            <br><br>
            Melalui kelas interaktif dan materi tersusun, Byzan Course menjadi ruang belajar digital yang relevan dengan perkembangan zaman. Pengguna dapat belajar kapan saja dan di mana saja, sesuai dengan ritme dan keadaan masing-masing.
        </p>
    </div>
</section>

  <section class="relative py-12 md:py-20 ">
    <div class="max-w-[1444px] rounded-4xl mx-auto px-4 md:px-12 lg:px-20 py-8 bg-white">
      <!-- Error state: menggantikan seluruh daftar kursus bila gagal & kosong -->
      <ErrorState
        v-if="coursesError && !loadingCourses && courses.length === 0"
        :error="coursesError"
        :loading="loadingCourses"
        @retry="fetchCourses"
      />

      <!-- Kursus Populer -->
      <div v-if="!coursesError || courses.length > 0" class="mb-[60px]">
        <h3 class="text-xl font-bold text-black font-montserrat">Kursus populer</h3>
        <div class="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 pt-6 items-stretch">
          <template v-if="loadingCourses">
            <div
              v-for="n in 8"
              :key="`popular-skel-${n}`"
              class="rounded-2xl overflow-hidden bg-white shadow-sm border border-gray-100"
            >
              <div class="w-full aspect-video shimmer"></div>
              <div class="p-4">
                <div class="h-4 w-3/4 rounded-md shimmer"></div>
                <div class="h-3 w-1/2 rounded-md shimmer mt-3"></div>
                <div class="flex items-center justify-between mt-4">
                  <div class="h-4 w-1/3 rounded-md shimmer"></div>
                  <div class="h-8 w-8 rounded-full shimmer"></div>
                </div>
              </div>
            </div>
          </template>
          <template v-else>
            <CourseCard
              v-for="course in popularCourses"
              :key="`popular-${course.id}`"
              :course="course"
              :formatPrice="formatPrice"
            />
          </template>
        </div>
      </div>

      <!-- All Courses -->
      <div v-if="!coursesError || courses.length > 0" class="mb-[60px]">
        <h3 class="text-xl font-bold text-black font-montserrat mb-6">
          Semua Kursus
          <span v-if="!loadingCourses">({{ courses.length }} kursus)</span>
        </h3>
        
        <!-- Courses Grid -->
        <div class="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 py-6 mb-8 items-stretch">
          <template v-if="loadingCourses">
            <div
              v-for="n in itemsPerPage"
              :key="`all-skel-${n}`"
              class="rounded-2xl overflow-hidden bg-white shadow-sm border border-gray-100"
            >
              <div class="w-full aspect-video shimmer"></div>
              <div class="p-4">
                <div class="h-4 w-3/4 rounded-md shimmer"></div>
                <div class="h-3 w-1/2 rounded-md shimmer mt-3"></div>
                <div class="flex items-center justify-between mt-4">
                  <div class="h-4 w-1/3 rounded-md shimmer"></div>
                  <div class="h-8 w-8 rounded-full shimmer"></div>
                </div>
              </div>
            </div>
          </template>
          <template v-else>
            <CourseCard
              v-for="course in paginatedCourses"
              :key="`all-${course.id}`"
              :course="course"
              :formatPrice="formatPrice"
            />
          </template>
        </div>

        <!-- Pagination -->
        <div v-if="!loadingCourses" class="flex justify-center">
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
  
  <!-- Get Kitab Popup -->
  <GetKitabPopup 
    :show="showGetKitab" 
    @close="showGetKitab = false" 
  />

  <!-- Register Modal -->
  <RegisterModal 
    :show="showRegisterModal" 
    @close="showRegisterModal = false" 
    @openLogin="handleOpenLogin"
  />

  <!-- Login Modal -->
  <div v-if="showLoginModal" @click="showLoginModal = false" class="modal-backdrop">
    <Login :isModal="true" @close="showLoginModal = false" @openRegister="handleOpenRegister" @click.stop />
  </div>

<AppFooter :is-authenticated="isAuthenticated" :user="auth.user" @logout="logout" />
  </div>
</template>

<style scoped>


:root {
  --primary-green: #009444;
  --text-dark: #000000;
  --text-light: #ffffff;
  --bg-light: #ffffff;
  --bg-dark: #121212;
  --font-montserrat: 'Montserrat', sans-serif;
  --font-comfortaa: 'Comfortaa', sans-serif;
}


/* Gradient blobs */
.gradient-blob-1 {
  background: radial-gradient(circle, rgba(34, 197, 94, 0.85) 0%, rgba(74, 222, 128, 0.65) 40%, rgba(16, 185, 129, 0.3) 70%, transparent 100%);
  border-radius: 45% 55% 60% 40% / 50% 60% 40% 50%;
  filter: blur(36px);
}

.gradient-blob-2 {
  background: radial-gradient(circle, rgba(22, 163, 74, 0.8) 0%, rgba(34, 197, 94, 0.6) 40%, rgba(5, 150, 105, 0.35) 70%, transparent 100%);
  border-radius: 60% 40% 50% 50% / 55% 45% 55% 45%;
  filter: blur(28px);
}

/* ===== Skeleton fade out ===== */
.skeleton-fade-leave-active {
  transition: opacity 0.4s ease;
}
.skeleton-fade-leave-to {
  opacity: 0;
}

/* ===== Shimmer loading ===== */
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
  background: linear-gradient(
    90deg,
    rgba(229, 231, 235, 0) 0%,
    rgba(255, 255, 255, 0.6) 50%,
    rgba(229, 231, 235, 0) 100%
  );
  animation: shimmer 1.4s infinite;
}
@keyframes shimmer {
  100% { transform: translateX(100%); }
}

/* Custom utilities not available in Tailwind */
.scrollbar-none {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.scrollbar-none::-webkit-scrollbar {
  display: none;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  padding: 20px;
}

@media (prefers-reduced-motion: reduce) {
  .shimmer::after,
  .animate-sway,
  .animate-float,
  .animate-drift,
  .animate-gradient-pulse {
    animation: none;
  }
}

</style>