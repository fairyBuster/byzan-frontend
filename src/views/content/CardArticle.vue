<script setup>
import { getAssetUrl } from "../../utils/assets";

defineProps({
  article: {
    type: Object,
    required: true,
  },
  articleImages: {
    type: Array,
    required: false,
    default: () => [],
  },
  displayCategoryName: {
    type: Function,
    required: true,
  },
  getCategoryColor: {
    type: Function,
    required: false,
  },
  isPost: {
    type: Boolean,
    required: false,
    default: false,
  },
});
</script>

<template>
  <router-link
    :to="{ name: 'byzanpost-details', params: { id: article.id } }"
    class="group flex flex-col justify-between h-full bg-white border border-gray-200 rounded-2xl overflow-hidden hover:-translate-y-1 hover:shadow-lg hover:border-primary/30 transition-all duration-200"
  >
    <div>
      <div class="relative h-48 md:h-52 overflow-hidden bg-gray-100">
        <img
          v-if="article.thumbnail || article.featured_image || article.image || articleImages[article.imageIndex || 0]"
          :src="article.thumbnail || article.featured_image || article.image || articleImages[article.imageIndex || 0]"
          :alt="article.title"
          class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div v-else class="absolute inset-0 bg-gradient-to-br from-green-100 to-emerald-200"></div>

        <div class="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/25 to-transparent"></div>
        <span
          class="absolute top-3 right-3 px-3 py-1 text-xs font-bold text-black bg-[#65FB5F] rounded-full shadow-sm"
        >
          {{ displayCategoryName(article.category) }}
        </span>
      </div>

      <div class="p-5 flex flex-col">
        <h3
          class="text-base md:text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary transition-colors leading-snug"
          v-html="article.title"
        ></h3>
        <p class="text-sm text-gray-600 line-clamp-3 leading-relaxed">{{ article.excerpt }}</p>
      </div>
    </div>

    <!-- Footer: tanggal saja (rating dihapus) -->
    <footer class="px-5 py-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
      <span class="truncate">{{ article.date }}</span>
      <span class="shrink-0 inline-flex items-center gap-1 text-primary font-semibold text-xs group-hover:gap-2 transition-all">
        Baca
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5">
          <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
        </svg>
      </span>
    </footer>
  </router-link>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>