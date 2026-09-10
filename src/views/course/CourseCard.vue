<script setup>
import { computed } from 'vue'

const props = defineProps({
  course: {
    type: Object,
    required: true,
  },
  formatPrice: {
    type: Function,
    required: false,
    default: (v) =>
      new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
      }).format(Number(v ?? 0)),
  },
})

const isFree = computed(
  () => Boolean(props.course?.is_free) || !Number(props.course?.price)
)

const ratingValue = computed(() => {
  const r = props.course?.rate ?? props.course?.rating_avg
  return r != null ? Number(r).toFixed(1) : null
})

const initials = computed(() =>
  String(props.course?.title || '?').trim().charAt(0).toUpperCase()
)
</script>

<template>
  <RouterLink
    :to="`/course/${course.id}`"
    class="group flex flex-col h-full bg-white rounded-xl md:rounded-2xl overflow-hidden border border-gray-200 hover:border-primary/40 hover:shadow-lg md:hover:-translate-y-1 transition-all duration-200"
  >
    <!-- Thumbnail -->
    <div class="relative w-full aspect-video shrink-0 overflow-hidden bg-gradient-to-br from-green-100 to-emerald-200">
      <img
        v-if="course.thumbnail"
        :src="course.thumbnail"
        :alt="course.title"
        class="w-full h-full object-cover md:group-hover:scale-105 transition-transform duration-300"
        loading="lazy"
      />
      <div v-else class="w-full h-full flex items-center justify-center">
        <span class="text-3xl md:text-5xl font-extrabold text-white/70 font-montserrat select-none">
          {{ initials }}
        </span>
      </div>

      <!-- Rating: pojok kanan atas, hemat ruang -->
      <span
        v-if="ratingValue"
        class="absolute top-2 right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-white text-[10px] md:text-[11px] font-semibold"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-2.5 h-2.5 md:w-3 md:h-3 text-yellow-300">
          <path d="M12 2l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 17.1 6.1 20.2l1.2-6.6L2.5 9l6.6-.9z" />
        </svg>
        {{ ratingValue }}
      </span>
    </div>

    <!-- Body -->
    <div class="flex flex-col flex-1 p-3 md:p-4">
      <h3 class="font-montserrat font-bold text-[13px] md:text-base text-gray-900 leading-snug line-clamp-2 group-hover:text-primary transition-colors">
        {{ course.title }}
      </h3>

      <p v-if="course.instructor_name" class="text-[11px] md:text-xs text-gray-500 font-medium mt-1 truncate">
        {{ course.instructor_name }}
      </p>

      <!-- Deskripsi: hanya tampil di layar besar, di mobile makan tempat -->
      <p class="hidden md:block text-xs text-gray-600 leading-relaxed line-clamp-2 mt-2">
        {{ course.description }}
      </p>

      <!-- Meta bawah: mt-auto bikin tinggi card seragam -->
      <div class="mt-auto pt-2.5 md:pt-3">
        <div class="flex items-center gap-1.5 text-[10px] md:text-[11px] text-gray-500 mb-2">
          <span v-if="course.total_lessons" class="whitespace-nowrap">
            {{ course.total_lessons }} lesson
          </span>
        </div>

        <div class="flex items-center justify-between gap-2 pt-2.5 border-t border-gray-100">
          <span
            class="font-montserrat font-bold text-xs md:text-sm truncate"
            :class="isFree ? 'text-[#009444]' : 'text-gray-900'"
          >
            {{ isFree ? 'Gratis' : formatPrice(course.price) }}
          </span>
          <span class="shrink-0 inline-flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-full bg-primary text-white group-hover:opacity-90 transition-opacity">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5">
              <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </div>
  </RouterLink>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>