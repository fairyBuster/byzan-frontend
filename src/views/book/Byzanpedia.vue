<script setup>
import { computed, ref, onMounted } from "vue";
import { useAuthStore } from "../../stores/auth";
import { useRouter } from "vue-router";
import AppHeader from "../../components/AppHeader.vue";
import AppFooter from "../../components/AppFooter.vue";
import UploadNaskahPopup from "../../components/UploadNaskahPopup.vue";
import QomusInfoPopup from "../../components/QomusInfoPopup.vue";
import SuccessModal from "../../components/SuccessModal.vue";
import ErrorModal from "../../components/ErrorModal.vue";
import { getAssetUrl } from "../../utils/assets";
import { emailService } from "../../services/email";

const auth = useAuthStore();
const router = useRouter();

const isAuthenticated = computed(() => auth.isAuthenticated);

const showUploadPopup = ref(false);
const showQomusPopup = ref(false);
const showSuccess = ref(false);
const showError = ref(false);
const successMessage = ref("");
const submitError = ref(null);

// Hero memakai beberapa gambar besar; tampilkan shimmer sampai gambar
// utamanya selesai dimuat supaya tidak ada area kosong yang berkedip.
const heroLoaded = ref(false);
const bookLoaded = ref(false);
const onHeroLoaded = () => { heroLoaded.value = true };
const onBookLoaded = () => { bookLoaded.value = true };

onMounted(() => {
  // Jaring pengaman kalau gambar gagal dimuat
  setTimeout(() => {
    heroLoaded.value = true;
    bookLoaded.value = true;
  }, 2500);
});

const logout = () => {
  auth.logout();
  router.push("/");
};

const openUploadPopup = () => { showUploadPopup.value = true };
const closeUploadPopup = () => { showUploadPopup.value = false };
const openQomusPopup = () => { showQomusPopup.value = true };
const closeQomusPopup = () => { showQomusPopup.value = false };

const handleManuscriptSubmission = async (formData) => {
  try {
    const result = await emailService.sendManuscriptSubmission(formData);
    if (result.success) {
      successMessage.value = result.message || "Naskah berhasil dikirim. Tim kami akan menghubungi Anda.";
      showSuccess.value = true;
      closeUploadPopup();
    }
  } catch (error) {
    submitError.value = error;
    showError.value = true;
  }
};

// Asset URLs
const bgImg1Src = getAssetUrl("3b647ba86b93a6f6ad4d4e23cbca320ddd9bae05.png");
const bgImg2Src = getAssetUrl("9ff92377ed91b288fee44b24989c7670ee2d50be.png");
const bgImg4Src = getAssetUrl("a4aa778fcd58ceecc24b6d085754fb0170db27d0.png");
const bgImg5Src = getAssetUrl("15f47f71f80b6474e00a66edd9fef321a837f795.png");
const bookPromoSrc = getAssetUrl("4816d2ebbaf9ddf9ad6a1e1f99f7b9bfb15fada7.png");
const aboutLogoSrc = getAssetUrl("e5953eaab12a20f86febfa843fd39a247183b510.png");
const cloudBackgroundSrc = getAssetUrl("70_1448.svg");
const greenGradientSrc = getAssetUrl("green-gradient.png");
</script>

<template>
  <div class="w-full max-w-none mx-auto relative">
    <AppHeader :is-authenticated="isAuthenticated" :user="auth.user" @logout="logout" />
    <SuccessModal
      :show="showSuccess"
      title="Berhasil"
      :message="successMessage"
      @close="showSuccess = false"
    />
    <ErrorModal
      :show="showError"
      title="Gagal Mengirim Naskah"
      :error="submitError"
      @close="showError = false"
    />

    <div class="overflow-hidden">
      <!-- ===== Hero ===== -->
      <section id="hero" class="relative w-full h-screen mt-0 z-0">
        <!-- Shimmer background selama gambar belum siap -->
        <div v-if="!heroLoaded" class="absolute inset-0 -z-1 shimmer-hero" aria-hidden="true"></div>

        <div class="absolute top-0 left-0 w-full h-full -z-1 transition-opacity duration-500" :class="heroLoaded ? 'opacity-100' : 'opacity-0'">
          <img
            :src="bgImg1Src"
            alt=""
            aria-hidden="true"
            class="absolute h-full w-full left-0 object-cover pointer-events-none select-none"
            fetchpriority="high"
            decoding="async"
            @load="onHeroLoaded"
            @error="onHeroLoaded"
          />
          <img
            :src="bgImg2Src"
            alt=""
            aria-hidden="true"
            class="absolute top-[605px] -left-[631px] w-[1316px] h-[892px] pointer-events-none select-none animate-gradient-pulse"
            loading="lazy"
            decoding="async"
          />
          <img
            :src="bgImg2Src"
            alt=""
            aria-hidden="true"
            class="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 origin-top-left pointer-events-none select-none"
            loading="lazy"
            decoding="async"
          />
          <img
            :src="bgImg4Src"
            alt=""
            aria-hidden="true"
            class="absolute bottom-[20%] md:bottom-[15%] lg:bottom-[10%] left-6 md:left-20 w-40 md:w-72 lg:w-xs pointer-events-none select-none animate-drift"
            loading="lazy"
            decoding="async"
          />
          <img
            :src="bgImg5Src"
            alt=""
            aria-hidden="true"
            class="absolute bottom-[10%] right-[40%] w-20 md:w-32 -rotate-[21.27deg] pointer-events-none select-none animate-float"
            loading="lazy"
            decoding="async"
          />
        </div>

        <!-- Konten hero -->
        <div class="relative h-full flex flex-col md:flex-row items-center justify-start max-w-7xl mx-auto px-5 md:px-6 md:-translate-y-20">
          <!-- Buku promo + shimmer -->
          <div class="relative w-44 md:w-sm lg:w-md md:-translate-y-24 mt-28 md:mt-0 shrink-0">
            <div v-if="!bookLoaded" class="w-full aspect-[3/4] rounded-2xl shimmer-light" aria-hidden="true"></div>
            <img
              :src="bookPromoSrc"
              alt="Buku Qomus Saku"
              class="w-full transition-opacity duration-500"
              :class="bookLoaded ? 'opacity-100' : 'opacity-0 absolute inset-0'"
              decoding="async"
              @load="onBookLoaded"
              @error="onBookLoaded"
            />
          </div>

          <div class="bg-black/5 backdrop-blur-sm shadow-[0px_4px_4px_rgba(255,255,255,0.25)] rounded-4xl rounded-bl-none text-white relative p-6 md:p-8 lg:p-10 mt-6 md:mt-0">
            <template v-if="!heroLoaded">
              <div class="h-10 md:h-16 w-56 md:w-80 rounded-lg shimmer-light" aria-hidden="true"></div>
              <div class="h-8 md:h-12 w-44 md:w-64 rounded-lg shimmer-light mt-3" aria-hidden="true"></div>
              <div class="h-7 md:h-10 w-52 md:w-72 rounded-lg shimmer-light mt-3" aria-hidden="true"></div>
            </template>
            <template v-else>
              <h1 class="text-2xl md:text-4xl lg:text-6xl leading-[1.2] m-0 font-montserrat">
                <span class="font-extrabold">Byzan</span><span class="font-medium">Pedia</span>
              </h1>
              <p class="font-bold text-[#64fb5f] -mt-2.5 mb-2.5 font-montserrat text-2xl md:text-3xl lg:text-5xl">
                Penerbit Buku
              </p>
              <p class="font-bold m-0 font-montserrat text-2xl md:text-3xl lg:text-4xl pb-2 md:pb-4">
                By Byzan Education
              </p>
              <button
                @click="openQomusPopup"
                class="absolute bottom-0 left-4 translate-y-1/2 bg-black rounded-lg px-4 py-2 text-white font-semibold hover:bg-gray-800 transition-colors cursor-pointer"
              >
                Cek Sekarang
              </button>
            </template>
          </div>
        </div>
      </section>

      <!-- ===== Deskripsi ===== -->
      <section class="pb-12 md:pb-0 relative">
        <img
          :src="cloudBackgroundSrc"
          alt=""
          aria-hidden="true"
          class="absolute -top-[15%] w-[125%] left-0 z-1 object-cover object-center animate-drift scale-x-[-1] pointer-events-none"
          loading="lazy"
          decoding="async"
        />
        <img
          :src="greenGradientSrc"
          alt=""
          aria-hidden="true"
          class="absolute top-0 left-0 right-0 w-full h-full -z-1 object-cover object-center pointer-events-none"
          loading="lazy"
          decoding="async"
        />

        <div
          class="relative w-[90%] md:w-[80%] lg:w-[70%] -translate-y-12 md:-translate-y-20 z-1 bg-black/20 rounded-[54px] rounded-br-none backdrop-blur-md shadow-[0px_4px_4px_0px_rgba(255,255,255,0.25)] text-white p-5 md:p-8 lg:p-10 mx-auto mb-10 md:mb-0"
        >
          <p class="font-comfortaa text-sm md:text-lg lg:text-xl font-semibold leading-relaxed md:leading-[1.7] text-justify max-w-[980px]">
            <span class="inline-flex me-4 align-middle">
              <img
                :src="aboutLogoSrc"
                alt="Logo ByzanPedia"
                class="w-[60px] h-[48px] md:w-[72px] md:h-[58px]"
                loading="lazy"
                decoding="async"
              />
            </span>
            <span class="text-2xl md:text-3xl lg:text-5xl font-medium m-0 p-0 font-montserrat">
              <span class="font-extrabold">Byzan</span>Pedia
            </span>
            adalah penerbit buku yang dikelola oleh Byzan Education. Fitur ini berfungsi sebagai ruang
            dokumentasi dan publikasi karya tulis, baik berupa buku ilmu pengetahuan, novel, buku
            panduan, ensiklopedia, dan lain sebagainya.
            <br /><br />
            Anda dapat mengirimkan naskah siap cetak untuk dipublikasikan secara profesional dan legal.
            Jika Anda memiliki naskah yang belum sepenuhnya siap, tim Byzanedu juga dapat membantu dalam
            proses penulisan ulang, penyusunan layout, hingga pembuatan desain sampul.
            <br /><br />
            Inisiatif ini merupakan bagian dari komitmen kami untuk mengembangkan budaya literasi
            baca-tulis melalui karya-karya yang diterbitkan.
          </p>
        </div>

        <div class="w-[90%] md:w-[80%] lg:w-[70%] mx-auto relative z-1 px-5 md:px-10 pb-10 -translate-y-10">
          <button
            @click="openUploadPopup"
            class="bg-black px-8 py-2.5 rounded-3xl font-semibold hover:bg-gray-800 transition-colors duration-200 cursor-pointer"
          >
            <span class="text-white">Upload Naskah</span>
          </button>
        </div>
      </section>
    </div>

    <AppFooter :is-authenticated="isAuthenticated" :user="auth.user" @logout="logout" />

    <UploadNaskahPopup
      :is-visible="showUploadPopup"
      @close="closeUploadPopup"
      @submit="handleManuscriptSubmission"
    />
    <QomusInfoPopup :show="showQomusPopup" @close="closeQomusPopup" />
  </div>
</template>

<style scoped>
.shimmer-hero,
.shimmer-light {
  position: relative;
  overflow: hidden;
}
.shimmer-hero { background: linear-gradient(135deg, #14532d 0%, #052e16 100%); }
.shimmer-light { background-color: rgba(255, 255, 255, 0.14); border-radius: inherit; }

.shimmer-hero::after,
.shimmer-light::after {
  content: '';
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0) 100%);
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer { 100% { transform: translateX(100%); } }

@media (prefers-reduced-motion: reduce) {
  .shimmer-hero::after,
  .shimmer-light::after { animation: none; }
}
</style>