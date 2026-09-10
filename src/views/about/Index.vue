<script setup>
import { computed, ref, onMounted, onUnmounted } from "vue";
import { useAuthStore } from "../../stores/auth";
import { useRouter } from "vue-router";
import AppHeader from "../../components/AppHeader.vue";
import AppFooter from "../../components/AppFooter.vue";
import { getAssetUrl } from "../../utils/assets";
import { CarouselCard, CarouselCardItem } from "vue-carousel-card";
import "vue-carousel-card/styles/index.css";

const auth = useAuthStore();
const router = useRouter();

const isAuthenticated = computed(() => auth.isAuthenticated);

const logout = () => {
  auth.logout();
  router.push("/");
};

// Asset URLs
const heroBgGradientSrc = getAssetUrl("1546614f57dbcbddaad5b7f9eda092ce3f610db4.png");
const heroImageSrc = getAssetUrl("9225467f6bbd20d904d0887f5ae9ddcd26a6e1f4.png");
const aboutIconSrc = getAssetUrl("c29de5aa1fc5f0701ae31f5c8e6620820754d49e.png");
const featuresBg1Src = getAssetUrl("a4172cfc499709269cb30af84c815743998b654c.png");
const featuresBg2Src = getAssetUrl("389_106.svg");
const postCardImageSrc = getAssetUrl("54f333db7281a49580cc7f2362aa68664d3460ec.png");
const courseImageSrc = getAssetUrl("5bd5c69c68fe54919744198aea008ec38c5ccf96.png");
const pediaImage2Src = getAssetUrl("3b647ba86b93a6f6ad4d4e23cbca320ddd9bae05.png");

const cardsData = [
  {
    id: "post",
    title: "Byzan Post",
    link: "/byzanpost",
    linkText: "Click Here For Reading",
    image: postCardImageSrc,
    alt: "Byzan Post",
  },
  {
    id: "course",
    title: "Byzan Course",
    link: "/course",
    linkText: "Click Here For Free Course",
    image: courseImageSrc,
    alt: "Byzan Course",
  },
  {
    id: "pedia",
    title: "Byzan Pedia",
    link: "/byzanpedia",
    linkText: "Click Here For Reading",
    image: pediaImage2Src,
    alt: "Byzan Pedia",
  },
];

// ===== Loading =====
// Hero memakai gambar besar; tampilkan shimmer sampai gambarnya benar-benar
// selesai dimuat agar tidak ada "kedipan" area kosong.
const heroLoaded = ref(false);
const onHeroLoaded = () => { heroLoaded.value = true };

// Carousel butuh ukuran window; tunda render sampai frame pertama
// supaya tidak terjadi lompatan layout.
const carouselReady = ref(false);

// ===== Carousel =====
const carouselCardRef = ref();
const currentSlide = ref(1);
const windowWidth = ref(typeof window !== "undefined" ? window.innerWidth : 1280);

const isMobile = computed(() => windowWidth.value < 640);
const carouselType = computed(() => (isMobile.value ? "" : "card"));
const carouselArrow = computed(() => (isMobile.value ? "never" : "always"));

const carouselHeight = computed(() => {
  if (windowWidth.value < 480) return "400px";
  if (windowWidth.value < 640) return "440px";
  if (windowWidth.value < 1024) return "420px";
  return "470px";
});

let resizeRafId = null;
const handleResize = () => {
  if (resizeRafId) return;
  resizeRafId = requestAnimationFrame(() => {
    windowWidth.value = window.innerWidth;
    resizeRafId = null;
  });
};

const changeHandle = (index) => { currentSlide.value = index };
const nextSlide = () => carouselCardRef.value?.next();
const prevSlide = () => carouselCardRef.value?.prev();
const goToSlide = (index) => carouselCardRef.value?.setActiveItem(index);

onMounted(() => {
  currentSlide.value = 1;
  window.addEventListener("resize", handleResize, { passive: true });
  requestAnimationFrame(() => { carouselReady.value = true });
  // Jaring pengaman: kalau gambar hero gagal/lama, jangan tahan UI selamanya
  setTimeout(() => { heroLoaded.value = true }, 2500);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  if (resizeRafId) cancelAnimationFrame(resizeRafId);
});
</script>

<template>
  <div class="max-w-full mx-auto relative overflow-x-hidden">
    <AppHeader :is-authenticated="isAuthenticated" :user="auth.user" @logout="logout" />

    <!-- ===== Hero ===== -->
    <section id="hero" class="relative h-[90vh] md:h-[75vh] overflow-hidden">
      <!-- Shimmer selama gambar hero belum siap -->
      <div v-if="!heroLoaded" class="absolute inset-0 z-0 shimmer-hero" aria-hidden="true"></div>

      <div class="absolute inset-0 z-0 transition-opacity duration-500" :class="heroLoaded ? 'opacity-100' : 'opacity-0'">
        <img
          :src="heroBgGradientSrc"
          alt=""
          aria-hidden="true"
          class="rotate-12 md:h-100vh lg:w-[2440px] -translate-x-1/2 translate-y-[-25%] absolute scale-x-[-1] max-w-none"
          fetchpriority="high"
          decoding="async"
          @load="onHeroLoaded"
          @error="onHeroLoaded"
        />
        <div class="absolute bottom-0 lg:right-24 top-auto left-auto mt-5 lg:mt-0 flex justify-center lg:justify-end items-end">
          <img
            :src="heroImageSrc"
            alt="Ilustrasi tiga karakter melambaikan tangan"
            class="w-[60%] h-auto object-contain"
            decoding="async"
          />
        </div>
      </div>

      <div class="relative z-10 h-full max-w-full mx-auto px-6 md:px-12 lg:px-24 w-full flex flex-col lg:justify-center lg:items-start justify-start items-center pt-[30%] lg:pt-0 pb-16 lg:pb-0 box-border gap-8">
        <div v-if="!heroLoaded" class="w-full max-w-[640px] flex flex-col gap-4" aria-hidden="true">
          <div class="h-14 md:h-20 w-64 md:w-96 rounded-xl shimmer-light"></div>
          <div class="h-8 w-52 rounded-lg shimmer-light"></div>
          <div class="h-40 w-full max-w-[615px] rounded-[39px_36px_38px_0px] shimmer-light mt-4"></div>
        </div>

        <template v-else>
          <div class="flex flex-col">
            <h1 class="font-extrabold text-5xl md:text-6xl lg:text-8xl text-white">About Us.</h1>
            <h2 class="font-semibold text-3xl lg:text-4xl text-white">Byzan Education</h2>
          </div>
          <div
            class="relative w-full lg:w-[615px] lg:h-[174px] h-auto bg-gray-100 rounded-[39px_36px_38px_0px] backdrop-blur-[10px] shadow-[inset_18px_17px_13.9px_0px_rgba(255,255,255,0.1),12px_10px_25.8px_0px_rgba(0,0,0,0.05)] p-10 md:p-12 md:pb-5 box-border"
          >
            <span class="absolute -top-4 left-6 font-extrabold text-5xl lg:text-[59.6px] text-black leading-tight">"</span>
            <p class="font-bold text-base md:text-lg lg:text-xl leading-tight pl-5 m-0">
              Byzan Education hadir sebagai ruang belajar digital yang berfokus pada misi besar:
              Bersama Kita, Level Up Literasi!
            </p>
          </div>
        </template>
      </div>
    </section>

    <!-- ===== About ===== -->
    <section id="about" class="bg-white w-full py-16 md:py-24">
      <div class="max-w-[1440px] px-6 md:px-12 lg:px-24 mx-auto box-border">
        <div class="flex flex-col lg:flex-row gap-6 lg:gap-10 items-start mb-10 md:mb-16">
          <img
            :src="aboutIconSrc"
            alt="Ikon Byzan Education"
            class="w-24 md:w-48 lg:w-60 shrink-0 object-contain mx-auto lg:mx-0"
            loading="lazy"
            decoding="async"
          />
          <div class="font-montserrat">
            <h3 class="font-bold text-2xl md:text-3xl mb-4">Byzan Education</h3>
            <p class="font-medium text-base md:text-lg lg:text-xl leading-relaxed text-justify mb-5">
              Byzan Education adalah platform yang bergerak di bidang pendidikan dan literasi keilmuan
              islam, dengan misi menghadirkan pengalaman belajar yang mudah, menyenangkan, dan relevan
              dengan sentuhan digitalisasi.
            </p>
            <p class="font-medium text-base md:text-lg lg:text-xl leading-relaxed text-justify m-0">
              Berawal dari semangat untuk belajar dan berbagi manfaat, Byzan lahir sebagai ruang bagi
              siapa saja yang ingin mengenal dan mempelajari Islam — baik dari dasar maupun pada level
              yang lebih mendalam. Kami percaya bahwa setiap orang, tanpa memandang latar belakangnya,
              berhak untuk mendapatkan akses terhadap ilmu yang benar dan kredibel.
            </p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10">
          <div class="rounded-3xl border border-gray-200 p-6 md:p-8">
            <h4 class="font-bold text-2xl md:text-3xl text-black mb-3">Visi</h4>
            <p class="font-medium text-base md:text-lg leading-relaxed m-0 text-gray-700">
              Menjadi platform digital pembelajaran Islam yang inklusif, kredibel, dan modern, yang
              menghubungkan siapa saja dengan ilmu agama secara mudah dan menyenangkan.
            </p>
          </div>
          <div class="rounded-3xl border border-gray-200 p-6 md:p-8">
            <h4 class="font-bold text-2xl md:text-3xl text-black mb-3">Tujuan Kami</h4>
            <p class="font-medium text-base md:text-lg leading-relaxed m-0 text-gray-700">
              Kami berharap Byzan Education menjadi platform lintas generasi — tempat semua kalangan
              dapat tumbuh bersama, belajar bersama, dan berkhidmat bersama. Karena masa depan yang
              cerdas, berawal dari satu hal sederhana: meningkatkan literasi kita hari ini.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== Features ===== -->
    <section id="features" class="relative bg-[#0a1e2a] overflow-hidden min-h-screen flex flex-col justify-center items-center py-16">
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <img
          :src="featuresBg1Src"
          alt=""
          aria-hidden="true"
          class="absolute top-0 left-1/2 transform -translate-x-1/2 w-full max-w-none object-cover"
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
      </div>

      <div class="relative z-10 text-center max-w-full mx-auto px-5 w-full">
        <h2 class="font-semibold text-2xl md:text-3xl text-white mb-10 md:mb-20">
          Learn, Grow, and Sharing with Us.
        </h2>

        <div class="w-full max-w-6xl mx-auto px-0 md:px-6 lg:px-8 relative">
          <!-- Skeleton carousel -->
          <div v-if="!carouselReady" class="grid grid-cols-1 sm:grid-cols-3 gap-4" aria-hidden="true">
            <div v-for="n in 3" :key="`car-sk-${n}`" class="rounded-3xl bg-white/10 p-4">
              <div class="w-full aspect-[4/3] rounded-2xl shimmer-light"></div>
              <div class="h-5 w-2/3 mx-auto rounded shimmer-light mt-4"></div>
              <div class="h-9 w-40 mx-auto rounded-full shimmer-light mt-3"></div>
            </div>
          </div>

          <CarouselCard
            v-else
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
                      index === currentSlide || isMobile ? 'text-lg md:text-2xl text-green-600' : 'text-base md:text-xl text-slate-800',
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

          <!-- Kontrol manual di mobile -->
          <div v-if="carouselReady && isMobile" class="flex items-center justify-center gap-3 mt-4">
            <button type="button" class="w-9 h-9 rounded-full bg-white/90 shadow flex items-center justify-center text-slate-700" aria-label="Sebelumnya" @click="prevSlide">‹</button>
            <div class="flex items-center gap-2">
              <button
                v-for="(card, index) in cardsData"
                :key="`dot-${card.id}`"
                type="button"
                class="rounded-full transition-all"
                :class="index === currentSlide ? 'w-5 h-2 bg-green-500' : 'w-2 h-2 bg-white/60'"
                :aria-label="`Ke ${card.title}`"
                @click="goToSlide(index)"
              ></button>
            </div>
            <button type="button" class="w-9 h-9 rounded-full bg-white/90 shadow flex items-center justify-center text-slate-700" aria-label="Berikutnya" @click="nextSlide">›</button>
          </div>
        </div>
      </div>
    </section>

    <AppFooter :is-authenticated="isAuthenticated" :user="auth.user" @logout="logout" />
  </div>
</template>

<style scoped>
/* ===== Shimmer ===== */
.shimmer-hero,
.shimmer-light {
  position: relative;
  overflow: hidden;
}
.shimmer-hero { background: linear-gradient(135deg, #0f766e 0%, #14532d 100%); }
.shimmer-light { background-color: rgba(255, 255, 255, 0.14); border-radius: inherit; }

.shimmer-hero::after,
.shimmer-light::after {
  content: '';
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.22) 50%, rgba(255,255,255,0) 100%);
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer { 100% { transform: translateX(100%); } }

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ===== Carousel overrides ===== */
.responsive-carousel { width: 100%; max-width: 100%; }
.responsive-carousel .carousel-card-mask { background: transparent !important; }
.responsive-carousel .carousel-card-item { padding: 0 10px; transition: all 0.3s ease; }
.responsive-carousel .carousel-card-item.is-active { z-index: 10; }

.carousel-card-content {
  max-width: 100%;
  margin: 0 auto;
  overflow: hidden;
}

.carousel-card .carousel-arrow {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  width: 44px;
  height: 44px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  color: rgb(30 41 59);
  backdrop-filter: blur(4px);
  transition: all 0.3s ease;
}
.carousel-card .carousel-arrow:hover { background: #fff; transform: scale(1.1); }
.carousel-card .carousel-indicators { bottom: -34px; }
.carousel-card .carousel-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  border: none;
  margin: 0 5px;
  transition: all 0.3s ease;
}
.carousel-card .carousel-indicator.is-active { background: rgb(22 163 74); transform: scale(1.25); }

@media (max-width: 639px) {
  .responsive-carousel .carousel-card-item { padding: 0 4px; }
  .responsive-carousel .carousel-arrow,
  .responsive-carousel .carousel-indicators { display: none !important; }
  .carousel-card-content { padding: 12px !important; border-radius: 20px; }
}

@media (prefers-reduced-motion: reduce) {
  .shimmer-hero::after,
  .shimmer-light::after { animation: none; }
}
</style>