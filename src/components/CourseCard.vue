<script setup>
import { Star } from "lucide-vue-next";
import { computed } from "vue";
import { RouterLink } from "vue-router";

// Props
const props = defineProps({
  course: {
    type: Object,
    required: true,
  },
  formatPrice: {
    type: Function,
    required: true,
  },
});

// Computed properties
const formattedDate = computed(() => {
  const raw = props.course?.createdAt || props.course?.created_at || Date.now()
  return new Date(raw).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
});

const safeDescription = computed(() => String(props.course?.description || ""))

const displayRating = computed(() => {
  const v =
    props.course?.rating_avg ??
    props.course?.rating ??
    props.course?.rate ??
    null
  return v == null ? null : Number(v)
})

const displayLessons = computed(() => {
  const total = props.course?.total_lessons ?? props.course?.episodes_count ?? null
  if (total == null) return null
  return Number(total)
})

const coursePrice = computed(() => {
  if (props.course.is_free) {
    return "Gratis";
  } else {
    const price = Number(props.course.price ?? props.course.amount ?? 0);
    if (props.formatPrice && typeof props.formatPrice === "function") {
      return props.formatPrice(price);
    }
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(price);
  }
});
</script>

<template>
  <RouterLink :to="`/course/${course.id}`"
    class="flex flex-col justify-between bg-white rounded-lg overflow-hidden shadow-md transition-transform duration-200 cursor-pointer hover:-translate-y-1 hover:shadow-lg"
  >
    <div class="flex flex-col justify-between flex-1">
      <div>
        <div
          class="w-full h-40 bg-linear-to-br from-green-100 to-green-200 relative overflow-hidden"
        >
          <img
            v-if="course.thumbnail || course.image || course.featured_image"
            :src="course.thumbnail || course.image || course.featured_image"
            :alt="course.title"
            class="w-full h-full object-cover block"
            loading="lazy"
          />
          <div
            v-else
            class="w-full h-full bg-linear-to-br from-green-600/10 to-green-600/20 flex items-center justify-center"
          ></div>
        </div>
        <div class="p-4 flex-1 flex flex-col justify-start">
          <h4
            class="text-base font-semibold text-black mb-2 leading-tight line-clamp-2"
          >
            {{ course.title }}
          </h4>
          <p class="text-sm text-gray-500 mb-3">
            {{ safeDescription.length > 100 ? safeDescription.slice(0, 100) + '...' : safeDescription }}
          </p>
          <p v-if="course.instructor_name" class="text-xs text-gray-600 font-semibold">
            {{ course.instructor_name }}
          </p>
        </div>
      </div>
      <div class="flex justify-between p-4"
        :class="course.is_free && 'justify-end'">
        <span
          class="text-sm font-semibold w-fit px-3 py-1"
          :class="course.is_free ? 'text-white bg-primary/70 rounded-lg al' : 'text-primary'"
          >{{ coursePrice }}</span
        >
         <RouterLink
          v-if="!course.is_free"
          :to="`/course/${course.id}`"
          class="bg-primary hover:bg-primary/90 font-semibold text-white px-2 py-1 rounded-lg text-sm transition-colors duration-200"
          @click.stop
        >
          Beli Course
        </RouterLink>
      </div>
    </div>
    <!-- footer card  -->
    <div class="border-t border-gray-200 py-2 px-4">
      <div class="flex items-center justify-between gap-3">
        <!-- <button 
          v-if="!course.is_free"
          class="bg-primary hover:bg-primary/90 text-white px-2 py-1 rounded-lg text-sm font-medium transition-colors duration-200"
          @click.stop="$emit('buy-course', course)"
        >
          Beli Course
        </button> -->
      </div>
      <div class="flex items-center justify-between gap-3 mb-2">
        <p class="text-sm text-primary">{{ formattedDate }}</p>
        <div class="flex items-center gap-3">
          <p v-if="displayLessons != null" class="text-xs text-gray-500 font-semibold">
            {{ displayLessons }} lesson
          </p>
          <div v-if="displayRating != null" class="flex items-center gap-1 text-[#F29D38] font-medium">
            <span class="text-primary"> {{ displayRating }} </span>
            <Star class="w-4" fill="#F29D38" />
          </div>
        </div>
      </div>
    </div>
  </RouterLink>
</template>
