<script setup>
import { getAssetUrl } from '../utils/assets'

const props = defineProps({
  isAuthenticated: { type: Boolean, default: false },
  user: { type: Object, default: null },
})

const emit = defineEmits(['logout'])

const footerLogo = getAssetUrl('e5953eaab12a20f86febfa843fd39a247183b510.png')
const instagramIcon = getAssetUrl('d6e9d911e05e4853dfe6b144f93286827d807a75.png')
const whatsappIcon = getAssetUrl('d9f04685c4960911b0fcce2f952a9c7057a7e680.png')
const youtubeIcon = getAssetUrl('dcee868fa23cefd86e0f9959a8f86193ce91c3c8.png')
const facebookIcon = getAssetUrl('4211d700a22f97457587d6472900c8916dd31370.png')
const homeIcon = getAssetUrl('1f8437822241c8162163d431a16249e9db1da3ca.png')

// ===== Navigasi internal (single source of truth) =====
// Sesuaikan `to` di sini kalau nama path di router berubah.
const productLinks = [
  { label: 'ByzanPost', to: '/byzanpost' },
  { label: 'ByzanCourse', to: '/course' },
  { label: 'ByzanPedia', to: '/byzanpedia' },
  { label: 'About Us', to: '/about' },
]

// ===== Sosial media resmi Byzan Education =====
const socialLinks = [
  {
    name: 'Instagram',
    icon: instagramIcon,
    url: 'https://www.instagram.com/byzan.education/',
    invert: true,
  },
  {
    name: 'WhatsApp',
    icon: whatsappIcon,
    url: 'https://wa.me/6285199111442?text=Halo%20Byzan%20Edu%2C%20saya%20ingin%20bertanya%20mengenai%20program%20yang%20tersedia.',
    invert: false,
  },
  {
    name: 'YouTube',
    icon: youtubeIcon,
    url: 'https://www.youtube.com/@byzanedu/videos',
    invert: false,
  },
  {
    name: 'Facebook',
    icon: facebookIcon,
    url: 'https://www.facebook.com/profile.php?id=61576473366875',
    invert: false,
  },
]

const handleLogout = () => emit('logout')
</script>

<template>
  <footer class="bg-[#121212] text-white py-6 px-6 md:px-20" id="footer">
    <div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5 py-4 md:py-8">
      <!-- Footer Brand -->
      <div class="flex flex-col gap-4 md:gap-6 lg:gap-8">
        <RouterLink to="/" class="flex items-center gap-3 no-underline text-white w-fit">
          <img :src="footerLogo" alt="Byzanedu Logo" class="w-18 h-14 grayscale brightness-0 invert" />
          <span class="text-2xl font-semibold">Byzanedu.com</span>
        </RouterLink>
        <p class="text-lg font-normal leading-tight max-w-md">
          Bersama kita, Level Up Literasi, dengan sentuhan digitalisasi
        </p>
        <div class="flex gap-6 md:gap-8">
          <a
            v-for="social in socialLinks"
            :key="social.name"
            :href="social.url"
            target="_blank"
            rel="noopener noreferrer"
            :aria-label="social.name"
            :title="social.name"
            class="transition-transform duration-200 hover:-translate-y-1 hover:opacity-90"
          >
            <img
              :src="social.icon"
              :alt="social.name"
              class="w-11"
              :class="social.invert ? 'grayscale brightness-0 invert' : ''"
            />
          </a>
        </div>
      </div>

      <!-- Footer Navigation -->
      <nav class="flex flex-col gap-4 ml-0 md:ml-5 justify-center">
        <RouterLink
          v-for="link in productLinks"
          :key="link.to"
          :to="link.to"
          class="text-base font-semibold text-white no-underline hover:text-gray-300 w-fit transition-colors"
        >
          {{ link.label }}
        </RouterLink>
      </nav>

      <!-- Footer Meta -->
      <div class="flex flex-col items-center md:items-end justify-between">
        <div class="flex items-center gap-4 pt-6">
          <RouterLink to="/" aria-label="Beranda">
            <img :src="homeIcon" alt="Home" class="w-10 h-10 grayscale brightness-0 invert me-0 md:me-8" />
          </RouterLink>
          <template v-if="!props.isAuthenticated">
            <router-link to="/login" class="bg-white px-3 py-1 rounded text-lg font-medium hover:bg-gray-100 transition-colors">
              <span class="text-black font-semibold">Log in</span>
            </router-link>
            <router-link to="/register" class="bg-green-600 px-3 py-1 rounded hover:bg-green-700 transition-colors">
              <span class="text-white text-lg font-semibold">Sign in</span>
            </router-link>
          </template>
          <template v-else>
            <span class="font-semibold font-montserrat">
              {{ props.user?.full_name || props.user?.username || props.user?.email || 'User' }}
            </span>
            <button
              class="bg-green-600 text-white px-3 py-1 rounded text-lg font-medium hover:bg-green-700 transition-colors"
              type="button"
              @click="handleLogout"
            >
              Logout
            </button>
          </template>
        </div>
        <p class="text-lg font-normal text-center md:text-right mt-4 md:mt-0">
          © 2025 Byzan Education. All Rights Reserved.
        </p>
      </div>
    </div>
  </footer>
</template>

<style scoped>
/* Custom utilities if needed */
</style>