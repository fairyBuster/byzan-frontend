<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth";
import AppHeader from "../../components/AppHeader.vue";
import AppFooter from "../../components/AppFooter.vue";
import { getAssetUrl } from "../../utils/assets";
import api from "../../services/api";
import CardArticle from "./CardArticle.vue";
import SuccessModal from "../../components/SuccessModal.vue";
import ErrorModal from "../../components/ErrorModal.vue";
import ErrorState from "../../components/ErrorState.vue";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const isAuthenticated = computed(() => auth.isAuthenticated);

const logout = () => {
  auth.logout();
  router.push("/");
};

const article = ref(null);
const relatedPosts = ref([]);
const comments = ref([]);
const loading = ref(false);
const error = ref(null);
const commentText = ref("");
const myPostRating = ref(0);
const commentsLoading = ref(false);
const commentsError = ref(null);
const posting = ref(false);
const showPostSuccess = ref(false);
const showPostError = ref(false);
const postSuccessMessage = ref("");
const postErrorMessage = ref("");

const API_ORIGIN = (() => {
  try {
    return new URL(api.defaults.baseURL).origin;
  } catch {
    return "";
  }
})();
const normalizeMediaUrl = (url) => {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  const path = String(url);
  return path.startsWith("/") ? `${API_ORIGIN}${path}` : `${API_ORIGIN}/${path}`;
};

const categories = ref([]);

const shareIconSrc = getAssetUrl("302df890445600c802bb7578df1f7711f87104a0.png");
const replyArrowSrc = getAssetUrl("c7c104945c9f6515191c5d535a892383f03d3f3c.png");

const toDisplayDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" });
};

const escapeHtml = (s) => String(s ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;");

const formatPlainTextToHtml = (text) => {
  const escaped = escapeHtml(text);
  return escaped
    .replace(/\r\n\r\n/g, "<br><br>")
    .replace(/\n\n/g, "<br><br>")
    .replace(/\r\n/g, "<br>")
    .replace(/\n/g, "<br>");
};

const formattedContentHtml = computed(() => {
  const raw = article.value?.content;
  if (!raw || typeof raw !== "string") return "";
  return formatPlainTextToHtml(raw);
});

const readingTime = computed(() => {
  let text = "";
  if (Array.isArray(article.value?.body)) {
    text = article.value.body.map((b) => b.content || "").join(" ");
  } else {
    text = String(article.value?.content || "");
  }
  const words = text.replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
});

const fetchCategories = async () => {
  try {
    const { data } = await api.get("/posts/categories/");
    categories.value = Array.isArray(data) ? data : data?.results || [];
  } catch (e) {
    categories.value = [];
  }
};

const loadArticle = async (articleId) => {
  if (!articleId) return;

  loading.value = true;
  error.value = null;
  article.value = null;
  relatedPosts.value = [];
  comments.value = [];
  commentText.value = "";
  myPostRating.value = 0;

  try {
    const { data } = await api.get(`/posts/id/${articleId}/`);
    article.value = {
      ...data,
      thumbnail: normalizeMediaUrl(data?.thumbnail_url || data?.thumbnail) || data?.thumbnail || null,
      date: toDisplayDate(data?.published_at || data?.created_at),
    };
    await fetchPostComments();

    try {
      const params = {};
      const slug = data?.category?.slug || null;
      if (slug) params.category = slug;
      const { data: relatedData } = await api.get("/posts/", { params });
      const list = Array.isArray(relatedData) ? relatedData : relatedData?.results || [];
      relatedPosts.value = list
        .filter((p) => String(p.id) !== String(articleId))
        .slice(0, 3)
        .map((p) => ({
          ...p,
          date: toDisplayDate(p?.published_at || p?.created_at),
          thumbnail: normalizeMediaUrl(p?.thumbnail_url || p?.thumbnail) || p?.thumbnail || null,
        }));
    } catch (e) {
      relatedPosts.value = [];
    }
  } catch (e) {
    error.value = e;
    article.value = null;
    relatedPosts.value = [];
    comments.value = [];
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  await fetchCategories();
  await loadArticle(route.params.id);
});

// PENTING: klik "Artikel Terkait" hanya mengubah route param, komponen di-reuse.
// Tanpa watch ini konten artikel tidak akan berganti.
watch(
  () => route.params.id,
  async (newId, oldId) => {
    if (!newId || newId === oldId) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
    await loadArticle(newId);
  }
);

const categoriesMapById = computed(() => {
  const map = {};
  for (const cat of categories.value) {
    map[cat.id] = cat;
  }
  return map;
});

const displayCategoryName = (category) => {
  if (category && typeof category === "object") {
    return category.name || "Article";
  }
  if (typeof category === "number") {
    return categoriesMapById.value[category]?.name || "Article";
  }
  return category || "Article";
};

const handleSubmitComment = async (e) => {
  e.preventDefault();
  if (!commentText.value.trim() && !myPostRating.value) return;

  if (!isAuthenticated.value) {
    router.push({ name: "login", query: { redirect: route.fullPath } });
    return;
  }

  try {
    posting.value = true;
    showPostSuccess.value = false;
    showPostError.value = false;
    postSuccessMessage.value = "";
    postErrorMessage.value = "";

    const payload = {
      rating: Number(myPostRating.value || 0),
      comment: String(commentText.value || "").trim(),
    };
    const slug = String(article.value?.slug || "").trim();
    if (!slug) throw new Error("Slug tidak ditemukan");
    const { data } = await api.post(`/posts/${encodeURIComponent(slug)}/comments/`, payload);
    postSuccessMessage.value = "Komentar berhasil disimpan.";
    showPostSuccess.value = true;
    commentText.value = "";
    myPostRating.value = 0;
    if (data) {
      const normalized = { ...data, user: data?.user || null };
      const replaced = comments.value.map((c) => (c.id === normalized.id ? normalized : c));
      const exists = replaced.some((c) => c.id === normalized.id);
      comments.value = exists ? replaced : [normalized, ...replaced];
    } else {
      await fetchPostComments();
    }
  } catch (e) {
    console.error("Failed to post comment:", e);
    const resData = e.response?.data;
    if (resData && typeof resData === "object") {
      const messages = Object.entries(resData)
        .map(([k, v]) => (Array.isArray(v) ? `${k}: ${v.join(", ")}` : `${k}: ${v}`))
        .join(" | ");
      postErrorMessage.value = messages;
    } else {
      postErrorMessage.value = e.response?.data?.message || e.response?.data?.error || e.message || "Gagal menyimpan komentar.";
    }
    showPostError.value = true;
  } finally {
    posting.value = false;
  }
};

const formatDateTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString("id-ID", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
};

const formatUserName = (u) => {
  if (!u) return "User";
  if (typeof u === "string") {
    const text = u.trim();
    if (text.startsWith("{") && text.endsWith("}")) {
      try {
        const parsed = JSON.parse(text);
        return parsed?.full_name || parsed?.username || parsed?.email || "User";
      } catch {
        return text;
      }
    }
    return text;
  }
  if (typeof u === "object") return u.full_name || u.username || u.email || "User";
  return "User";
};

const setPostRating = (v) => {
  const n = Number(v);
  if (Number.isFinite(n) && n >= 1 && n <= 5) myPostRating.value = n;
};

const fetchPostComments = async () => {
  const postId = route.params.id;
  if (!postId) return;
  if (!isAuthenticated.value) return;

  commentsLoading.value = true;
  commentsError.value = null;
  try {
    const slug = String(article.value?.slug || "").trim();
    if (!slug) throw new Error("Slug tidak ditemukan");
    const { data } = await api.get(`/posts/${encodeURIComponent(slug)}/comments/`);
    comments.value = Array.isArray(data) ? data : data?.results || [];
  } catch (e) {
    commentsError.value = e.response?.data?.message || e.message || "Gagal memuat komentar.";
    comments.value = [];
  } finally {
    commentsLoading.value = false;
  }
};

const goBack = () => {
  if (window.history.state?.back) {
    router.back();
  } else {
    router.push("/byzanpost");
  }
};
</script>

<template>
  <div class="relative bg-white">
    <AppHeader :is-authenticated="isAuthenticated" :user="auth.user" @logout="logout" />
    <SuccessModal :show="showPostSuccess" title="Berhasil" :message="postSuccessMessage" @close="showPostSuccess = false" />
    <ErrorModal :show="showPostError" title="Gagal" :message="postErrorMessage" @close="showPostError = false" />

    <main>
      <!-- ===== Loading skeleton ===== -->
      <template v-if="loading">
        <header class="border-b border-gray-100">
          <div class="max-w-[760px] mx-auto px-4 pt-6 md:pt-10 pb-8">
            <div class="h-10 w-36 rounded-full shimmer mb-6"></div>
            <div class="h-6 w-24 rounded-full shimmer mb-4"></div>
            <div class="h-9 md:h-11 w-full rounded shimmer"></div>
            <div class="h-9 md:h-11 w-2/3 rounded shimmer mt-3"></div>
            <div class="h-4 w-52 rounded shimmer mt-6"></div>
          </div>
          <div class="max-w-[900px] mx-auto px-4 pb-2">
            <div class="w-full aspect-[16/8] rounded-2xl shimmer"></div>
          </div>
        </header>

        <div class="max-w-[760px] mx-auto px-4 py-10 md:py-14">
          <div v-for="n in 5" :key="`body-skel-${n}`" class="mb-5">
            <div class="h-4 w-full rounded shimmer"></div>
            <div class="h-4 w-full rounded shimmer mt-2.5"></div>
            <div class="h-4 w-4/5 rounded shimmer mt-2.5"></div>
          </div>
        </div>

        <div class="max-w-[760px] mx-auto px-4 pb-14">
          <div class="h-7 w-40 rounded shimmer mb-6"></div>
          <div class="h-[180px] w-full rounded-2xl shimmer"></div>
        </div>

        <div class="bg-gray-50 border-t border-gray-100 py-14">
          <div class="max-w-[1200px] mx-auto px-4">
            <div class="h-7 w-44 rounded shimmer mb-6"></div>
            <div class="grid gap-6 md:gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              <div v-for="n in 3" :key="`rel-skel-${n}`" class="rounded-2xl overflow-hidden bg-white border border-gray-200">
                <div class="h-52 shimmer"></div>
                <div class="p-5">
                  <div class="h-5 w-3/4 rounded shimmer"></div>
                  <div class="h-3 w-full rounded shimmer mt-3"></div>
                  <div class="h-3 w-2/3 rounded shimmer mt-2"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- ===== Error ===== -->
      <div v-else-if="error" class="py-16">
        <ErrorState :error="error" :loading="loading" @retry="loadArticle(route.params.id)">
          <template #actions>
            <router-link to="/byzanpost" class="inline-flex items-center rounded-lg px-5 py-2.5 font-montserrat font-semibold text-sm border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
              Semua Artikel
            </router-link>
          </template>
        </ErrorState>
      </div>

      <!-- ===== Article ===== -->
      <template v-else-if="article">
        <header class="border-b border-gray-100">
          <div class="max-w-[760px] mx-auto px-4 pt-6 md:pt-10 pb-8">
            <!-- Tombol kembali: pill jelas, bukan teks polos yang nempel badge -->
            <button
              type="button"
              @click="goBack"
              class="group inline-flex items-center gap-2 mb-6 pl-3 pr-4 py-2 rounded-full border border-gray-200 bg-white text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 hover:border-gray-300 hover:text-primary transition-all cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 group-hover:-translate-x-0.5 transition-transform">
                <path d="m15 18-6-6 6-6" />
              </svg>
              Semua Artikel
            </button>

            <!-- Kategori di baris sendiri -->
            <div class="mb-4">
              <span class="inline-block bg-[#64fb5f] text-black px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                {{ displayCategoryName(article.category) }}
              </span>
            </div>

            <h1 class="text-3xl md:text-4xl lg:text-[2.75rem] font-extrabold text-gray-900 leading-[1.15] tracking-tight mb-5">
              {{ article.title }}
            </h1>

            <!-- Meta: tanggal + waktu baca saja -->
            <div class="flex items-center gap-2 text-sm text-gray-500">
              <span>{{ article.date }}</span>
              <span class="text-gray-300">·</span>
              <span>{{ readingTime }} min baca</span>
            </div>
          </div>

          <div class="max-w-[900px] mx-auto px-4 pb-2">
            <img
              v-if="article.thumbnail || article.featured_image || article.heroImage || article.image"
              :src="article.thumbnail || article.featured_image || article.heroImage || article.image"
              :alt="article.title"
              class="w-full aspect-[16/8] object-cover rounded-2xl shadow-sm"
            />
            <div v-else class="w-full aspect-[16/8] rounded-2xl bg-gray-100"></div>
          </div>
        </header>

        <!-- Body -->
        <div class="max-w-[760px] mx-auto px-4 py-10 md:py-14">
          <div class="article-prose text-gray-800">
            <template v-if="article.body && article.body.length > 0">
              <template v-for="(item, index) in article.body" :key="index">
                <p v-if="item.type === 'paragraph'" v-html="item.content"></p>
                <hr v-else-if="item.type === 'separator'" class="my-10 border-gray-200" />
              </template>
            </template>
            <div v-else v-html="formattedContentHtml"></div>
          </div>

          <div class="flex items-center gap-3 mt-10 pt-6 border-t border-gray-100">
            <span class="text-sm font-medium text-gray-500">Bagikan:</span>
            <button class="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors" aria-label="Bagikan">
              <img :src="shareIconSrc" alt="Share" class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Comments -->
        <section id="comments" class="max-w-[760px] mx-auto px-4 pb-14">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">
            Komentar
            <span class="text-gray-400 font-medium text-lg">({{ comments.length }})</span>
          </h2>

          <form class="bg-gray-50 rounded-2xl p-5 md:p-6 mb-10 border border-gray-100" @submit.prevent="handleSubmitComment">
            <label class="block text-sm font-semibold text-gray-700 mb-2">Beri rating &amp; komentar</label>
            <div class="flex items-center gap-1 mb-3">
              <button
                v-for="i in 5" :key="`post-rate-${i}`" type="button"
                class="text-3xl border-0 bg-transparent cursor-pointer transition-transform hover:scale-110 leading-none"
                :class="i <= myPostRating ? 'text-[#009444]' : 'text-gray-300'"
                @click="setPostRating(i)" :title="`Beri rating ${i}`"
              >★</button>
            </div>
            <textarea
              v-model="commentText"
              placeholder="Tulis komentarmu..."
              class="w-full min-h-[110px] border border-gray-300 rounded-xl p-4 text-sm resize-vertical outline-none focus:ring-2 focus:ring-[#009444] focus:border-transparent bg-white"
            ></textarea>
            <div class="flex justify-end mt-3">
              <button
                type="submit"
                class="bg-[#009444] hover:bg-[#007a38] text-white border-0 rounded-xl px-6 py-2.5 font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                :disabled="posting"
              >
                {{ posting ? 'Mengirim...' : 'Kirim Komentar' }}
              </button>
            </div>
          </form>

          <div v-if="!isAuthenticated" class="text-center py-10 bg-gray-50 rounded-2xl border border-gray-100">
            <p class="text-gray-500 mb-4">Login dulu untuk melihat &amp; menulis komentar.</p>
            <button
              class="bg-primary text-white px-5 py-2.5 rounded-lg font-semibold"
              @click="router.push({ name: 'login', query: { redirect: route.fullPath } })"
            >
              Login
            </button>
          </div>
          <div v-else-if="commentsLoading" class="flex flex-col gap-5">
            <div v-for="n in 2" :key="`cmt-skel-${n}`" class="flex gap-3.5">
              <div class="shrink-0 w-10 h-10 rounded-full shimmer"></div>
              <div class="flex-1">
                <div class="h-4 w-32 rounded shimmer"></div>
                <div class="h-3 w-full rounded shimmer mt-2.5"></div>
                <div class="h-3 w-3/4 rounded shimmer mt-2"></div>
              </div>
            </div>
          </div>
          <div v-else-if="commentsError" class="text-center py-6 px-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{{ commentsError }}</div>
          <div v-else-if="comments.length === 0" class="text-center py-12 bg-gray-50 rounded-2xl border border-gray-100">
            <p class="text-gray-500 m-0">Belum ada komentar.</p>
            <p class="text-sm text-gray-400 mt-1">Jadilah yang pertama berkomentar!</p>
          </div>
          <div v-else class="flex flex-col gap-5">
            <div v-for="comment in comments" :key="comment.id" class="flex gap-3.5">
              <div class="shrink-0 w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm uppercase">
                {{ (formatUserName(comment.user) || 'U').charAt(0) }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap mb-1">
                  <span class="font-semibold text-gray-900 text-sm">{{ formatUserName(comment.user) || comment.author || "Anonymous" }}</span>
                  <span v-if="comment.rating" class="text-[#009444] text-xs">{{ '★'.repeat(Number(comment.rating) || 0) }}</span>
                  <span class="text-xs text-gray-400">{{ formatDateTime(comment.created_at || comment.updated_at) }}</span>
                </div>
                <p class="text-sm text-gray-700 leading-relaxed m-0">{{ comment.comment || comment.text || comment.content }}</p>
                <p v-if="comment.replies" class="text-sm text-gray-600 mt-2 pl-3 border-l-2 border-gray-200">{{ comment.replies }}</p>
                <button class="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-primary mt-2 transition-colors" @click.prevent>
                  <img :src="replyArrowSrc" alt="" class="w-3.5 h-2.5 rotate-180" /> Balas
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- Artikel Terkait -->
        <section v-if="relatedPosts.length" class="bg-gray-50 border-t border-gray-100 py-14 md:py-16">
          <div class="max-w-[1200px] mx-auto px-4">
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-2xl font-bold text-gray-900">Artikel Terkait</h2>
              <router-link to="/byzanpost" class="text-sm font-semibold text-primary hover:underline">Lihat semua →</router-link>
            </div>
            <div class="grid gap-6 md:gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              <CardArticle
                v-for="post in relatedPosts"
                :key="post.id"
                :article="post"
                :display-category-name="displayCategoryName"
              />
            </div>
          </div>
        </section>
      </template>
    </main>

    <AppFooter :is-authenticated="isAuthenticated" :user="auth.user" @logout="logout" />
  </div>
</template>

<style scoped>
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

/* Reading typography */
.article-prose {
  font-size: 1.125rem;
  line-height: 1.85;
}
.article-prose :deep(p) {
  margin: 0 0 1.5rem 0;
}
.article-prose :deep(h2) {
  font-size: 1.6rem;
  font-weight: 800;
  line-height: 1.3;
  margin: 2.5rem 0 1rem;
  color: #111827;
}
.article-prose :deep(h3) {
  font-size: 1.3rem;
  font-weight: 700;
  margin: 2rem 0 0.75rem;
  color: #111827;
}
.article-prose :deep(a) {
  color: #009444;
  text-decoration: underline;
  text-underline-offset: 2px;
}
.article-prose :deep(blockquote) {
  border-left: 4px solid #009444;
  padding: 0.25rem 0 0.25rem 1.25rem;
  margin: 1.75rem 0;
  color: #374151;
  font-style: italic;
}
.article-prose :deep(ul),
.article-prose :deep(ol) {
  margin: 0 0 1.5rem 1.5rem;
}
.article-prose :deep(li) {
  margin-bottom: 0.5rem;
}
.article-prose :deep(img) {
  border-radius: 0.75rem;
  margin: 1.5rem 0;
  width: 100%;
}

@media (prefers-reduced-motion: reduce) {
  .shimmer::after { animation: none; }
}
</style>