<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import AppFooter from '../components/AppFooter.vue'
import AppHeader from '../components/AppHeader.vue'
import { getAssetUrl } from '../utils/assets'
import { useAuthStore } from '../stores/auth'
import { CarouselCard, CarouselCardItem } from 'vue-carousel-card'
import 'vue-carousel-card/styles/index.css'

const auth = useAuthStore()

const isAuthenticated = computed(() => auth.isAuthenticated)
const displayName = computed(() => auth.user?.name || auth.user?.email || '')

const heroBackgroundSrc = getAssetUrl('9c94e32a83719ff8f61468240cd520818cd948cf.png')
const heroGradientSrc = getAssetUrl('1546614f57dbcbddaad5b7f9eda092ce3f610db4.png')
const scrollIndicatorSrc = getAssetUrl('6b67e94644a008c44eb8be2a796f9a04f64046af.png')
const byzantiumLogoSrc = getAssetUrl('byzantiumlogo.png')
const bookImageSrc = getAssetUrl('book.png')

// Assets untuk Features Section
const brainImgSrc = getAssetUrl('brain.png')
const cloudImgSrc = getAssetUrl('cloud.png')
const gradient3Src = getAssetUrl('gradient3.png')
const gradient4Src = getAssetUrl('gradient4.jpg')
const planePaperSrc = getAssetUrl('plane-paper.png')
const featuresBg2Src = getAssetUrl('389_106.svg')
const postCardImageSrc = getAssetUrl('54f333db7281a49580cc7f2362aa68664d3460ec.png')
const courseImageSrc = getAssetUrl('5bd5c69c68fe54919744198aea008ec38c5ccf96.png')
const pediaImage2Src = getAssetUrl('3b647ba86b93a6f6ad4d4e23cbca320ddd9bae05.png')

// Data untuk cards features
const cardsData = [
  {
    id: 'post',
    title: 'Byzan Post',
    link: '/byzanpost',
    linkText: 'Click Here For Reading',
    image: postCardImageSrc,
    alt: 'Byzan Post',
  },
  {
    id: 'course',
    title: 'Byzan Course',
    link: '/course',
    linkText: 'Click Here For Free Course',
    image: courseImageSrc,
    alt: 'Byzan Course',
  },
  {
    id: 'pedia',
    title: 'Byzan Pedia',
    link: '/byzanpedia',
    linkText: 'Click Here For Reading',
    image: pediaImage2Src,
    alt: 'Byzan Pedia',
  },
]

const heroBackgroundStyle = computed(() => ({
  '--hero-gradient-image': `url(${heroGradientSrc})`,
}))

const logout = () => {
  auth.logout()
}

// ===== Carousel =====
const carouselCardRef = ref()
const currentSlide = ref(1) // kartu tengah = Byzan Course
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1280)

const isMobile = computed(() => windowWidth.value < 640)

// Di mobile pakai slide biasa (1 kartu penuh) supaya tidak terpotong;
// di tablet ke atas baru pakai mode "card" yang menampilkan sisi kiri-kanan.
const carouselType = computed(() => (isMobile.value ? '' : 'card'))
const carouselArrow = computed(() => (isMobile.value ? 'never' : 'always'))

const carouselHeight = computed(() => {
  if (windowWidth.value < 480) return '400px'
  if (windowWidth.value < 640) return '440px'
  if (windowWidth.value < 1024) return '420px'
  return '470px'
})

let resizeRafId = null
const handleResize = () => {
  if (resizeRafId) return
  resizeRafId = requestAnimationFrame(() => {
    windowWidth.value = window.innerWidth
    resizeRafId = null
  })
}

onMounted(() => {
  currentSlide.value = 1
  window.addEventListener('resize', handleResize, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (resizeRafId) cancelAnimationFrame(resizeRafId)
})

const changeHandle = (index) => {
  currentSlide.value = index
}

const nextSlide = () => carouselCardRef.value?.next()
const prevSlide = () => carouselCardRef.value?.prev()
const goToSlide = (index) => carouselCardRef.value?.setActiveItem(index)

const smoothScrollToFeatures = (event) => {
  event.preventDefault()
  const featuresSection = document.getElementById('features')
  if (featuresSection) {
    featuresSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}
</script>

<template>
  <div class="font-montserrat mx-auto bg-light text-[--color-text] relative">
    <AppHeader :is-authenticated="isAuthenticated" :user="auth.user" @logout="logout" />

    <div class="overflow-x-hidden">
      <section
        id="hero"
        class="h-screen relative flex flex-col items-center justify-start text-center text-[--color-text] -mt-[79px]"
      >
        <div class="absolute inset-0 z-0 pointer-events-none" aria-hidden="true" :style="heroBackgroundStyle">
          <!-- Hero = LCP: jangan lazy, kasih prioritas tinggi -->
          <img
            :src="heroBackgroundSrc"
            alt="Group of students"
            class="absolute inset-0 w-full h-full object-cover object-center block min-w-full min-h-full"
            loading="eager"
            fetchpriority="high"
            decoding="async"
          />
          <div
            class="hero-gradient hero-gradient-1 absolute bg-cover w-[1800px] h-[2000px] top-[37px] right-0 translate-x-1/2 rotate-[55.48deg] z-0 animate-gradient-pulse"
          ></div>
          <div
            class="hero-gradient hero-gradient-2 absolute bg-cover w-[1000px] h-[1000px] top-120 -left-[500px] rotate-[210.35deg] z-1 animate-gradient-shift"
          ></div>
        </div>
        <div class="pt-32 max-w-[780px] mx-auto flex flex-col items-center gap-6 relative z-2 px-5">
          <h1 class="flex flex-col gap-2">
            <span class="font-comic-neue font-bold text-xl md:text-2xl lg:text-3xl capitalize text-shadow-white">Bersama Kita</span>
            <span class="font-comfortaa font-bold text-2xl md:text-3xl lg:text-5xl capitalize text-shadow-white">Level Up Literasi !</span>
            <span class="font-montserrat font-semibold text-base md:text-[18.5px] text-[#009444] text-primary text-shadow-white-sm">dengan sentuhan digitalisasi</span>
          </h1>
        </div>
        <a
          href="#features"
          @click="smoothScrollToFeatures"
          class="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[50px] h-[61px] z-1"
          aria-label="Scroll to products"
        >
          <img :src="scrollIndicatorSrc" alt="Scroll down arrow" class="w-full animate-bounce" loading="lazy" decoding="async" />
        </a>
      </section>

      <section id="features" class="relative pt-[68px] pb-[120px] md:pb-[203px] md:min-h-screen">
        <div class="absolute top-0 left-0 w-full h-full pointer-events-none">
          <img
            :src="gradient3Src"
            alt=""
            aria-hidden="true"
            class="absolute top-[10vh] left-0 -translate-x-1/2 w-[250vw] object-cover z-0"
            loading="lazy"
            decoding="async"
          />
          <img
            :src="featuresBg2Src"
            alt=""
            aria-hidden="true"
            class="absolute top-0 left-1/2 transform -translate-x-1/2 w-[1823px] h-[994px] opacity-50 max-w-none object-cover"
            loading="lazy"
            decoding="async"
          />
          <img
            :src="brainImgSrc"
            alt=""
            aria-hidden="true"
            class="absolute top-10 md:top-16 lg:top-20 left-6 md:left-20 lg:left-32 w-28 md:w-64 lg:w-[270px] object-cover z-0 animate-wiggle"
            loading="lazy"
            decoding="async"
          />
          <img
            :src="planePaperSrc"
            alt=""
            aria-hidden="true"
            class="absolute top-20 md:top-32 lg:top-40 right-6 md:right-20 w-14 md:w-32 lg:w-[132px] object-cover z-0 animate-float"
            loading="lazy"
            decoding="async"
          />
          <img
            :src="cloudImgSrc"
            alt=""
            aria-hidden="true"
            class="absolute bottom-10 left-20 w-full object-cover z-0 animate-drift"
            loading="lazy"
            decoding="async"
          />
          <img
            :src="bookImageSrc"
            alt=""
            aria-hidden="true"
            class="absolute -bottom-6 md:-bottom-10 right-6 md:right-28 w-20 md:w-40 lg:w-[210px] object-cover z-1 animate-sway"
            loading="lazy"
            decoding="async"
          />
        </div>

        <div class="relative z-2 text-center max-w-full mx-auto px-5 w-full">
          <div class="flex flex-col gap-1 mt-6 md:mt-12 lg:pt-20">
            <h2 class="text-lg md:text-xl lg:text-3xl font-semibold pb-0 lg:pb-4">Byzan Education</h2>
            <h3 class="text-xl md:text-2xl lg:text-5xl font-comfortaa font-semibold">Boost Your Literacy!</h3>
            <h2 class="font-montserrat font-semibold text-base md:text-2xl lg:text-3xl text-green-600">
              Learn, Grow, and Sharing with Us.
            </h2>
          </div>

          <div class="rounded-lg max-w-7xl mx-auto mt-6">
            <div class="w-full max-w-6xl mx-auto my-8 px-0 md:px-6 lg:px-8 relative">
              <CarouselCard
                ref="carouselCardRef"
                :key="carouselType"
                :interval="4000"
                :autoplay="true"
                :height="carouselHeight"
                :type="carouselType"
                :pause-on-hover="true"
                :initial-index="1"
                :arrow="carouselArrow"
                class="relative responsive-carousel"
                @change="changeHandle"
              >
                <CarouselCardItem
                  v-for="(card, index) in cardsData"
                  :key="card.id"
                  :name="card.id"
                  class="bg-none!"
                >
                  <div
                    :class="[
                      'carousel-card-content w-full h-full rounded-3xl p-3 sm:p-4 box-border flex flex-col transition-all duration-500 ease-out',
                      index === currentSlide || isMobile
                        ? 'bg-white opacity-100 z-10'
                        : 'bg-white/25 backdrop-blur-2xl opacity-90 hover:opacity-100',
                    ]"
                  >
                    <!-- Area gambar: flex-1 + min-h-0 supaya selalu pas, tidak pernah meluber -->
                    <div class="w-full flex-1 min-h-0 rounded-2xl overflow-hidden">
                      <img
                        :src="card.image"
                        :alt="card.alt"
                        class="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>

                    <div class="shrink-0 flex flex-col items-center justify-center pt-3 gap-2">
                      <h3
                        :class="[
                          'font-montserrat font-bold leading-tight m-0 transition-colors duration-300 line-clamp-1',
                          index === currentSlide || isMobile
                            ? 'text-lg md:text-2xl text-green-600'
                            : 'text-base md:text-xl text-slate-800',
                        ]"
                      >
                        {{ card.title }}
                      </h3>
                      <router-link
                        :to="card.link"
                        :class="[
                          'font-montserrat font-semibold no-underline rounded-full transition-all duration-300 inline-block text-center',
                          index === currentSlide || isMobile
                            ? 'text-xs md:text-sm px-4 md:px-6 py-2 md:py-2.5 bg-green-600 text-white hover:bg-green-500 hover:shadow-lg hover:shadow-green-500/30'
                            : 'text-xs px-4 py-2 bg-white/30 text-slate-800 hover:bg-white/50',
                        ]"
                      >
                        {{ card.linkText }}
                      </router-link>
                    </div>
                  </div>
                </CarouselCardItem>
              </CarouselCard>

              <!-- Kontrol manual khusus mobile (arrow bawaan disembunyikan) -->
              <div v-if="isMobile" class="flex items-center justify-center gap-3 mt-4">
                <button
                  type="button"
                  class="w-9 h-9 rounded-full bg-white/90 shadow flex items-center justify-center text-slate-700"
                  aria-label="Sebelumnya"
                  @click="prevSlide"
                >
                  ‹
                </button>
                <div class="flex items-center gap-2">
                  <button
                    v-for="(card, index) in cardsData"
                    :key="`dot-${card.id}`"
                    type="button"
                    class="rounded-full transition-all"
                    :class="index === currentSlide ? 'w-5 h-2 bg-green-600' : 'w-2 h-2 bg-white/70'"
                    :aria-label="`Ke ${card.title}`"
                    @click="goToSlide(index)"
                  ></button>
                </div>
                <button
                  type="button"
                  class="w-9 h-9 rounded-full bg-white/90 shadow flex items-center justify-center text-slate-700"
                  aria-label="Berikutnya"
                  @click="nextSlide"
                >
                  ›
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="about" class="w-full min-h-screen mx-auto py-20 px-5 md:px-6 relative overflow-hidden">
        <div class="absolute inset-0 z-0 pointer-events-none" aria-hidden="true">
          <div
            class="absolute inset-0 bg-cover bg-center bg-no-repeat"
            :style="{ backgroundImage: `url(${gradient4Src})` }"
          ></div>
        </div>
        <img
          :src="cloudImgSrc"
          alt=""
          aria-hidden="true"
          class="absolute top-[80%] left-48 w-full object-cover z-0 scale-x-[-1] animate-drift"
          loading="lazy"
          decoding="async"
        />
        <div class="relative flex justify-center items-center my-6 md:my-12 w-full">
          <img
            :src="planePaperSrc"
            alt=""
            aria-hidden="true"
            class="w-10 md:w-16 lg:w-36 pb-2 rotate-24 object-cover z-0 scale-x-[-1] animate-float"
            loading="lazy"
            decoding="async"
          />
          <h2 class="text-white font-bold text-2xl md:text-3xl lg:text-5xl">About Byzan Education</h2>
        </div>
        <div class="flex flex-col lg:flex-row gap-12 items-stretch mx-auto md:px-24 relative z-10">
          <div class="flex justify-center items-center">
            <img
              :src="byzantiumLogoSrc"
              alt="Byzan Education logo"
              class="w-24 md:w-40 lg:w-64 rounded-2xl object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div class="bg-white flex-1 pt-4 md:pt-8 lg:pt-16 px-4 md:px-8 rounded-2xl lg:rounded-e-4xl lg:rounded-s-4xl lg:rounded-bl-none shadow-lg">
            <div class="flex flex-col items-center justify-center h-full gap-2 px-0 md:px-16">
              <p class="font-comfortaa text-sm md:text-lg lg:text-xl font-light text-justify">
                Nama Byzan merupakan singkatan dari
                <span class="text-green-600">“Biziyadatil Ulumina Likhidmatil Ummat”</span>
                yang bermakna “Dengan bertambahnya ilmu kita, untuk berkhidmat kepada umat.” Filosofi ini menjadi dasar
                setiap langkah kami — bahwa ilmu harus tumbuh dan memberi manfaat bagi banyak orang.
              </p>
              <p class="font-comfortaa text-sm md:text-lg lg:text-xl font-light text-justify pt-4">
                Melalui sentuhan digital, Byzan Education mengajak generasi muda untuk belajar dengan lebih kritis, lebih
                terarah, dan fokus. Kami ingin membentuk generasi yang mampu berpikir mendalam, memiliki pandangan luas,
                serta siap berkontribusi nyata bagi masa depan yang lebih cerdas.
              </p>
              <RouterLink
                to="/about"
                class="bg-green-600 self-start px-3 py-1.5 md:py-2 md:px-4 rounded-full my-4 hover:shadow-lg hover:shadow-green-500/30 hover:bg-green-500 flex items-center justify-center transition-all duration-300 no-underline"
              >
                <span class="text-white font-bold text-sm md:text-base">Read More</span>
              </RouterLink>
            </div>
          </div>
        </div>
      </section>
    </div>

    <AppFooter :is-authenticated="isAuthenticated" :user="auth.user" @logout="logout" />
  </div>
</template>

<style>
/* Custom gradient background */
.hero-gradient {
  background-image: var(--hero-gradient-image);
}

.carousel-card-mask {
  background: transparent !important;
}

/* ===== Vue Carousel Card overrides ===== */
.responsive-carousel {
  width: 100%;
  max-width: 100%;
}
.responsive-carousel .carousel-card-mask {
  background: transparent !important;
}
.responsive-carousel .carousel-card-item {
  padding: 0 10px;
  transition: all 0.3s ease;
}
.responsive-carousel .carousel-card-item.is-active {
  z-index: 10;
}

/* Kartu selalu mengisi tinggi item; layout diatur flex di template
   sehingga gambar + judul + tombol tidak pernah keluar dari kartu. */
.carousel-card-content {
  max-width: 100%;
  margin: 0 auto;
  overflow: hidden;
}

/* Arrow bawaan */
.carousel-card .carousel-arrow {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  width: 44px;
  height: 44px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  color: rgb(30 41 59);
  font-size: 1.25rem;
  backdrop-filter: blur(4px);
  transition: all 0.3s ease;
}
.carousel-card .carousel-arrow:hover {
  background: rgb(255, 255, 255);
  transform: scale(1.1);
}
.carousel-card .carousel-indicators {
  bottom: -34px;
}
.carousel-card .carousel-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  border: none;
  margin: 0 5px;
  transition: all 0.3s ease;
}
.carousel-card .carousel-indicator.is-active {
  background: rgb(22 163 74);
  transform: scale(1.25);
}

/* Mobile: rapatkan padding item & sembunyikan arrow/indicator bawaan
   karena sudah diganti kontrol manual di template. */
@media (max-width: 639px) {
  .responsive-carousel .carousel-card-item {
    padding: 0 4px;
  }
  .responsive-carousel .carousel-arrow,
  .responsive-carousel .carousel-indicators {
    display: none !important;
  }
  .carousel-card-content {
    padding: 12px !important;
    border-radius: 20px;
  }
}

/* Sweep animation */
#features::after {
  content: "";
  position: absolute;
  inset: 0;
  left: -30%;
  width: 60%;
  height: 100%;
  background: radial-gradient(
    60% 120% at 50% 50%,
    rgba(96, 233, 83, 0.25) 0%,
    rgba(96, 233, 83, 0.15) 35%,
    rgba(96, 233, 83, 0.08) 55%,
    rgba(96, 233, 83, 0) 70%
  );
  filter: blur(30px);
  transform: translateX(-120%);
  animation: sweepOverlay 10s ease-in-out infinite;
  pointer-events: none;
}
@keyframes sweepOverlay {
  from { transform: translateX(-120%); }
  to { transform: translateX(120%); }
}
#features:hover::after {
  animation-play-state: paused;
}

/* ===== Custom Animation Classes ===== */
@keyframes wiggle {
  0%, 100% { transform: rotate(12deg); }
  25% { transform: rotate(8deg); }
  75% { transform: rotate(16deg); }
}
@keyframes float {
  0%, 100% { transform: rotate(44deg) translateY(0px); }
  50% { transform: rotate(44deg) translateY(-10px); }
}
@keyframes drift {
  0%, 100% { transform: translateX(0px); }
  50% { transform: translateX(15px); }
}
@keyframes sway {
  0%, 100% { transform: rotate(-2deg); }
  50% { transform: rotate(2deg); }
}
.animate-wiggle { animation: wiggle 4s ease-in-out infinite; }
.animate-float { animation: float 3s ease-in-out infinite; }
.animate-drift { animation: drift 6s ease-in-out infinite; }
.animate-sway { animation: sway 3.5s ease-in-out infinite; }

/* Gradient Background Animations */
@keyframes gradientPulse {
  0%, 100% { opacity: 1; filter: brightness(1) hue-rotate(0deg); }
  25% { opacity: 0.3; filter: brightness(1.2) hue-rotate(5deg); }
  50% { opacity: 0.5; filter: brightness(0.8) hue-rotate(-5deg); }
  75% { opacity: 0.8; filter: brightness(1.1) hue-rotate(3deg); }
}
@keyframes gradientShift {
  0%, 100% { opacity: 0.9; filter: saturate(1) blur(0px) brightness(1); }
  20% { opacity: 0.3; filter: saturate(1.3) blur(1px) brightness(1.2); }
  40% { opacity: 0.6; filter: saturate(0.8) blur(0.5px) brightness(0.9); }
  60% { opacity: 0.8; filter: saturate(1.1) blur(0px) brightness(1.1); }
  80% { opacity: 0.4; filter: saturate(1.2) blur(1px) brightness(1.3); }
}
.animate-gradient-pulse { animation: gradientPulse 7s ease-in-out infinite; }
.animate-gradient-shift { animation: gradientShift 9s ease-in-out infinite; }

/* Text Shadow Classes */
.text-shadow-white {
  text-shadow:
    0 0 2px rgba(255, 255, 255, 0.5),
    1px 1px 1px rgba(255, 255, 255, 0.4),
    -1px -1px 1px rgba(255, 255, 255, 0.4);
}
.text-shadow-white-sm {
  text-shadow:
    0 0 1px rgba(255, 255, 255, 0.4),
    1px 1px 1px rgba(255, 255, 255, 0.3),
    -1px -1px 1px rgba(255, 255, 255, 0.3);
}

@media (prefers-reduced-motion: reduce) {
  #features::after,
  .animate-wiggle,
  .animate-float,
  .animate-drift,
  .animate-sway,
  .animate-gradient-pulse,
  .animate-gradient-shift {
    animation: none;
  }
}
</style>