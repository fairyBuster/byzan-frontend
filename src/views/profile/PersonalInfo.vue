<script setup>
import { onMounted, computed, reactive, ref } from "vue";
import { useAuthStore } from "../../stores/auth";
import { useRouter } from "vue-router";
import AppHeader from "../../components/AppHeader.vue";
import AppFooter from "../../components/AppFooter.vue";
import SuccessModal from "../../components/SuccessModal.vue";
import ErrorModal from "../../components/ErrorModal.vue";
import { getAssetUrl } from "../../utils/assets";
import api from "../../services/api";
import { CirclePlus, Settings, BookOpen, PenLine, GraduationCap } from "lucide-vue-next";

const auth = useAuthStore();
const router = useRouter();

const currentUserId = ref(null);
const loading = ref(false);        // saat menyimpan
const initialLoading = ref(true);  // saat memuat profil pertama kali
const emailVerified = ref(false);

const showSuccess = ref(false);
const showError = ref(false);
const successMessage = ref("");
const saveError = ref(null);

// Field sidebar (tidak bisa diedit langsung)
const profileName = ref("Your Full Name");
const profileRole = ref("author");

const form = reactive({
  gender: "male",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  birthday: "",
  country: "",
  address: "",
  city: "",
  instagram: "",
  facebook: "",
});

async function loadProfile() {
  try {
    const { data } = await api.get("/auth/profile/");
    currentUserId.value = data?.id ?? null;
    emailVerified.value = Boolean(data?.email_verified);
    form.gender = data?.gender || form.gender;
    form.firstName = data?.first_name || "";
    form.lastName = data?.last_name || "";
    form.email = data?.email || "";
    form.phone = data?.phone || "";
    form.birthday = data?.birthday || "";
    form.country = data?.country || "";
    form.address = data?.address || "";
    form.city = data?.city || "";
    form.instagram = data?.instagram_link || "";
    form.facebook = data?.facebook_link || "";
    profileRole.value = data?.username || profileRole.value;
    const nameCandidate = `${data?.first_name || ""} ${data?.last_name || ""}`.trim();
    profileName.value = nameCandidate || data?.full_name || data?.email || profileName.value;
    if (data) {
      auth.user = data;
      localStorage.setItem("userData", JSON.stringify(data));
    }
  } catch (err) {
    saveError.value = err;
    showError.value = true;
  } finally {
    initialLoading.value = false;
  }
}

async function savePersonalInfo() {
  saveError.value = null;
  showError.value = false;
  showSuccess.value = false;
  loading.value = true;
  try {
    const fullName = `${String(form.firstName || "").trim()} ${String(form.lastName || "").trim()}`
      .trim()
      .replace(/\s+/g, " ");
    const payload = {
      gender: form.gender,
      first_name: form.firstName,
      last_name: form.lastName,
      email: form.email,
      phone: form.phone,
      birthday: form.birthday,
      country: form.country,
      address: form.address,
      city: form.city,
      instagram_link: form.instagram,
      facebook_link: form.facebook,
      full_name: fullName,
    };
    const { data } = await api.put("/auth/profile/", payload);
    if (data) {
      auth.user = data;
      localStorage.setItem("userData", JSON.stringify(data));
      emailVerified.value = Boolean(data?.email_verified);
      const nameCandidate = `${data?.first_name || ""} ${data?.last_name || ""}`.trim();
      profileName.value = nameCandidate || data?.full_name || data?.email || profileName.value;
    }
    successMessage.value = "Perubahan profil berhasil disimpan.";
    showSuccess.value = true;
  } catch (err) {
    saveError.value = err;
    showError.value = true;
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  // Isi form sementara dari cache supaya tidak terasa kosong,
  // lalu di-overwrite oleh data terbaru dari API.
  if (auth.user) {
    form.firstName = auth.user.first_name || "";
    form.lastName = auth.user.last_name || "";
    form.email = auth.user.email || "";
    const nameCandidate = `${auth.user.first_name || ""} ${auth.user.last_name || ""}`.trim();
    profileName.value = nameCandidate || auth.user.full_name || auth.user.email || profileName.value;
  }
  loadProfile();
});

const isAuthenticated = computed(() => auth.isAuthenticated);

const logout = () => {
  auth.logout();
  router.push("/");
};

const initials = computed(() => {
  const parts = String(profileName.value || "").trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return String(profileName.value || "?").charAt(0).toUpperCase();
});

// Kelengkapan profil: dorongan halus agar user melengkapi datanya
const completeness = computed(() => {
  const fields = ["firstName", "lastName", "email", "phone", "birthday", "country", "city", "address"];
  const filled = fields.filter((f) => String(form[f] || "").trim()).length;
  return Math.round((filled / fields.length) * 100);
});

const quickActions = [
  { title: "Upload Artikel", subtitle: "Byzan Post", to: "/byzanpost", icon: PenLine },
  { title: "Terbitkan Buku", subtitle: "Byzan Pedia", to: "/byzanpedia", icon: BookOpen },
  { title: "Jadi Instruktur", subtitle: "Byzan Course", to: "/course", icon: GraduationCap },
];

// Asset URLs
const backgroundGradientSrc = getAssetUrl("1546614f57dbcbddaad5b7f9eda092ce3f610db4.png");
const bannerBgSrc1 = getAssetUrl("a4172cfc499709269cb30af84c815743998b654c.png");
const profilePicSrc = getAssetUrl("418ce2a6ab9bbfb81b05025a5cbf21a6e735def0.png");
const starIconSrc = getAssetUrl("ae82f0fc275cc9614de9be18a7b57f7d24b16b0d.png");
const verifiedIconSrc = getAssetUrl("189_278.svg");
const paperPlaneSrc = getAssetUrl("15f47f71f80b6474e00a66edd9fef321a837f795.png");
</script>

<template>
  <div
    class="relative w-full bg-cover bg-top bg-no-repeat min-h-screen"
    :style="{ backgroundImage: `url('${backgroundGradientSrc}')` }"
  >
    <AppHeader :is-authenticated="isAuthenticated" :user="auth.user" @logout="logout" />

    <SuccessModal
      :show="showSuccess"
      title="Berhasil"
      :message="successMessage"
      @close="showSuccess = false"
    />
    <ErrorModal
      :show="showError"
      title="Gagal Menyimpan"
      :error="saveError"
      @close="showError = false"
    />

    <main id="user-profile" class="relative pb-20">
      <!-- Banner -->
      <div class="absolute top-0 left-0 w-full h-56 md:h-64 overflow-hidden">
        <img :src="bannerBgSrc1" alt="" aria-hidden="true" class="w-full h-full object-cover" />
        <div class="absolute inset-0 bg-gradient-to-b from-black/10 to-black/40"></div>
      </div>

      <div class="relative max-w-[1280px] mx-auto px-4 md:px-8 lg:px-12 pt-36 md:pt-40">
        <div class="flex flex-col lg:flex-row gap-6">
          <!-- ===== Sidebar ===== -->
          <aside class="w-full lg:w-[320px] shrink-0 flex flex-col gap-5">
            <!-- Kartu identitas -->
            <div class="bg-white rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] p-6 text-center">
              <div class="relative w-32 h-32 mx-auto -mt-20 mb-4">
                <div class="w-full h-full rounded-full overflow-hidden ring-4 ring-white shadow-lg bg-gray-100">
                  <div v-if="initialLoading" class="w-full h-full shimmer"></div>
                  <img v-else :src="profilePicSrc" alt="Foto profil" class="w-full h-full object-cover" />
                </div>
                <button
                  class="absolute bottom-1 right-1 cursor-pointer bg-transparent border-0 p-0 transition-transform hover:scale-110"
                  type="button"
                  aria-label="Ganti foto profil"
                >
                  <CirclePlus class="w-9 h-9 text-white bg-[#009444] rounded-full" />
                </button>
              </div>

              <template v-if="initialLoading">
                <div class="h-6 w-40 mx-auto rounded shimmer"></div>
                <div class="h-4 w-24 mx-auto rounded shimmer mt-2"></div>
              </template>
              <template v-else>
                <h1 class="font-montserrat text-xl font-bold text-gray-900 m-0">{{ profileName }}</h1>
                <p class="font-montserrat text-sm text-gray-500 mt-1 mb-0">@{{ profileRole }}</p>
                <span
                  v-if="emailVerified"
                  class="inline-flex items-center gap-1.5 mt-3 bg-green-50 text-[#009444] rounded-full px-3 py-1 font-montserrat text-xs font-bold"
                >
                  <img :src="verifiedIconSrc" alt="" aria-hidden="true" class="w-3.5 h-3.5" />
                  Email terverifikasi
                </span>
                <span
                  v-else
                  class="inline-flex items-center gap-1.5 mt-3 bg-amber-50 text-amber-700 rounded-full px-3 py-1 font-montserrat text-xs font-bold"
                >
                  Email belum diverifikasi
                </span>
              </template>

              <!-- Kelengkapan profil -->
              <div v-if="!initialLoading" class="mt-5 text-left">
                <div class="flex items-baseline justify-between mb-1.5">
                  <span class="font-montserrat text-xs font-semibold text-gray-600">Kelengkapan profil</span>
                  <span class="font-montserrat text-xs font-bold text-[#009444]">{{ completeness }}%</span>
                </div>
                <div class="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div class="h-full rounded-full bg-[#009444] transition-all duration-500" :style="{ width: `${completeness}%` }"></div>
                </div>
              </div>

              <button
                class="mt-5 w-full h-11 bg-white border border-gray-300 text-gray-800 rounded-full font-montserrat text-sm font-bold cursor-pointer transition-colors hover:bg-gray-900 hover:text-white hover:border-gray-900 inline-flex items-center justify-center gap-2"
                type="button"
              >
                <Settings class="w-4 h-4" />
                Pengaturan
              </button>
            </div>

            <!-- Kartu pencapaian -->
            <div class="bg-white rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] p-6">
              <h2 class="font-montserrat text-sm font-bold text-gray-900 m-0 mb-4 uppercase tracking-wider">
                Pencapaian
              </h2>

              <div v-if="initialLoading" class="flex flex-col gap-4">
                <div class="h-16 w-full rounded-xl shimmer"></div>
                <div class="h-16 w-full rounded-xl shimmer"></div>
              </div>

              <div v-else class="flex flex-col gap-4">
                <div class="rounded-2xl bg-gray-50 p-4">
                  <p class="font-montserrat text-xs font-semibold text-gray-500 m-0">Artikel Dipublikasikan</p>
                  <p class="font-montserrat text-2xl font-bold text-gray-900 m-0 mt-0.5">12</p>
                  <div class="flex items-center gap-1.5 mt-2">
                    <span class="flex gap-0.5">
                      <img v-for="n in 4" :key="`s-${n}`" :src="starIconSrc" alt="" aria-hidden="true" class="w-3 h-3.5" />
                      <img :src="starIconSrc" alt="" aria-hidden="true" class="w-1.5 h-3.5 object-cover object-left" />
                    </span>
                    <span class="font-montserrat text-xs font-semibold text-gray-600">4.7</span>
                  </div>
                </div>

                <div class="rounded-2xl bg-gray-50 p-4">
                  <p class="font-montserrat text-xs font-semibold text-gray-500 m-0">Buku Diterbitkan</p>
                  <p class="font-montserrat text-2xl font-bold text-gray-900 m-0 mt-0.5">2</p>
                  <RouterLink to="/byzanpedia" class="font-montserrat text-xs font-semibold text-[#009444] no-underline hover:underline mt-2 inline-block">
                    Lihat perpustakaan saya →
                  </RouterLink>
                </div>
              </div>
            </div>
          </aside>

          <!-- ===== Form ===== -->
          <div class="flex-1 min-w-0">
            <div class="bg-white rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] p-6 md:p-8">
              <div class="mb-6">
                <h2 class="font-montserrat text-xl md:text-2xl font-bold text-gray-900 m-0">Informasi Pribadi</h2>
                <p class="font-montserrat text-sm text-gray-500 mt-1 mb-0">
                  Data ini dipakai untuk sertifikat dan komunikasi dari Byzan Education.
                </p>
              </div>

              <!-- Skeleton form -->
              <div v-if="initialLoading" class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5" aria-hidden="true">
                <div v-for="n in 8" :key="`f-sk-${n}`" :class="n === 7 ? 'md:col-span-2' : ''">
                  <div class="h-3 w-24 rounded shimmer"></div>
                  <div class="h-12 w-full rounded-xl shimmer mt-2"></div>
                </div>
                <div class="md:col-span-2 h-11 w-44 rounded-full shimmer mt-2"></div>
              </div>

              <form v-else @submit.prevent="savePersonalInfo" novalidate>
                <!-- Gender -->
                <div class="mb-5">
                  <span class="field-label">Jenis Kelamin<span class="text-red-500">*</span></span>
                  <div class="flex gap-3 mt-2">
                    <label
                      class="flex-1 md:flex-none md:w-36 flex items-center justify-center gap-2 h-11 rounded-xl border cursor-pointer transition-all font-montserrat text-sm font-semibold"
                      :class="form.gender === 'male' ? 'border-[#009444] bg-green-50 text-[#009444]' : 'border-gray-200 text-gray-600 hover:border-gray-300'"
                    >
                      <input type="radio" v-model="form.gender" value="male" class="sr-only" />
                      Laki-laki
                    </label>
                    <label
                      class="flex-1 md:flex-none md:w-36 flex items-center justify-center gap-2 h-11 rounded-xl border cursor-pointer transition-all font-montserrat text-sm font-semibold"
                      :class="form.gender === 'female' ? 'border-[#009444] bg-green-50 text-[#009444]' : 'border-gray-200 text-gray-600 hover:border-gray-300'"
                    >
                      <input type="radio" v-model="form.gender" value="female" class="sr-only" />
                      Perempuan
                    </label>
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                  <div class="field">
                    <label for="first-name" class="field-label">Nama Depan<span class="text-red-500">*</span></label>
                    <input type="text" id="first-name" v-model="form.firstName" class="field-input" required />
                  </div>

                  <div class="field">
                    <label for="last-name" class="field-label">Nama Belakang<span class="text-red-500">*</span></label>
                    <input type="text" id="last-name" v-model="form.lastName" class="field-input" required />
                  </div>

                  <div class="field">
                    <label for="email" class="field-label">Email<span class="text-red-500">*</span></label>
                    <div class="relative">
                      <input type="email" id="email" v-model="form.email" class="field-input pr-24 bg-gray-100 text-gray-500 cursor-not-allowed" disabled />
                      <span
                        class="absolute right-3 top-1/2 -translate-y-1/2 font-montserrat text-[11px] font-bold"
                        :class="emailVerified ? 'text-[#009444]' : 'text-gray-400'"
                      >
                        {{ emailVerified ? 'Terverifikasi' : 'Belum verif' }}
                      </span>
                    </div>
                    <p class="field-hint">Email tidak bisa diubah sendiri. Hubungi admin bila perlu.</p>
                  </div>

                  <div class="field">
                    <label for="phone" class="field-label">Nomor Telepon<span class="text-red-500">*</span></label>
                    <input type="tel" id="phone" v-model="form.phone" class="field-input" required />
                  </div>

                  <div class="field">
                    <label for="birthday" class="field-label">Tanggal Lahir<span class="text-red-500">*</span></label>
                    <input type="date" id="birthday" v-model="form.birthday" class="field-input" required />
                  </div>

                  <div class="field">
                    <label for="country" class="field-label">Negara<span class="text-red-500">*</span></label>
                    <input type="text" id="country" v-model="form.country" class="field-input" required />
                  </div>

                  <div class="field">
                    <label for="city" class="field-label">Kota<span class="text-red-500">*</span></label>
                    <input type="text" id="city" v-model="form.city" class="field-input" required />
                  </div>

                  <div class="field">
                    <label for="instagram" class="field-label">Instagram</label>
                    <input type="url" id="instagram" v-model="form.instagram" class="field-input" placeholder="https://instagram.com/..." />
                  </div>

                  <div class="field md:col-span-2">
                    <label for="facebook" class="field-label">Facebook</label>
                    <input type="url" id="facebook" v-model="form.facebook" class="field-input" placeholder="https://facebook.com/..." />
                  </div>

                  <div class="field md:col-span-2">
                    <label for="address" class="field-label">Alamat</label>
                    <textarea id="address" v-model="form.address" rows="3" class="field-input resize-none py-3 h-auto"></textarea>
                  </div>
                </div>

                <div class="mt-7 pt-5 border-t border-gray-100 flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    class="h-11 px-8 bg-[#009444] text-white rounded-full font-montserrat text-sm font-bold border-0 cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    :disabled="loading"
                  >
                    {{ loading ? "Menyimpan..." : "Simpan Perubahan" }}
                  </button>
                  <span class="font-montserrat text-xs text-gray-400">
                    Perubahan langsung tersimpan ke akun Anda.
                  </span>
                </div>
              </form>
            </div>

            <!-- Aksi cepat -->
            <div class="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <template v-if="initialLoading">
                <div v-for="n in 3" :key="`qa-sk-${n}`" class="h-24 rounded-2xl shimmer"></div>
              </template>
              <template v-else>
                <RouterLink
                  v-for="action in quickActions"
                  :key="action.title"
                  :to="action.to"
                  class="group bg-white rounded-2xl p-5 flex items-center justify-between gap-3 no-underline shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-all hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)]"
                >
                  <span class="min-w-0">
                    <span class="block font-montserrat text-base font-bold text-gray-900 leading-snug">{{ action.title }}</span>
                    <span class="block font-montserrat text-xs font-bold text-[#009444] mt-0.5">{{ action.subtitle }}</span>
                  </span>
                  <span class="flex items-center justify-center w-12 h-12 rounded-xl bg-green-50 text-[#009444] shrink-0 transition-colors group-hover:bg-[#009444] group-hover:text-white">
                    <component :is="action.icon" class="w-5 h-5" />
                  </span>
                </RouterLink>
              </template>
            </div>
          </div>
        </div>
      </div>

      <img
        :src="paperPlaneSrc"
        alt=""
        aria-hidden="true"
        class="hidden xl:block absolute right-10 bottom-24 w-24 scale-x-[-1] opacity-70 animate-float pointer-events-none"
      />
    </main>

    <AppFooter :is-authenticated="isAuthenticated" :user="auth.user" @logout="logout" />
  </div>
</template>

<style scoped>
/* ===== Shimmer ===== */
.shimmer {
  position: relative;
  overflow: hidden;
  background-color: #e9ecef;
  border-radius: inherit;
}
.shimmer::after {
  content: '';
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, rgba(233,236,239,0) 0%, rgba(255,255,255,0.75) 50%, rgba(233,236,239,0) 100%);
  animation: shimmer 1.4s infinite;
}
@keyframes shimmer { 100% { transform: translateX(100%); } }

/* ===== Field ===== */
.field { display: flex; flex-direction: column; }

.field-label {
  display: block;
  font-family: 'Montserrat', sans-serif;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 6px;
}

.field-input {
  width: 100%;
  height: 48px;
  padding: 0 16px;
  box-sizing: border-box;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  font-family: 'Montserrat', sans-serif;
  font-size: 14px;
  color: #111827;
  transition: border-color 0.2s, background-color 0.2s, box-shadow 0.2s;
}

.field-input::placeholder { color: #9ca3af; }

.field-input:focus {
  outline: none;
  background-color: #fff;
  border-color: #009444;
  box-shadow: 0 0 0 3px rgba(0, 148, 68, 0.12);
}

.field-input:disabled { border-color: #e5e7eb; }

.field-hint {
  margin: 6px 0 0;
  font-family: 'Montserrat', sans-serif;
  font-size: 11px;
  color: #9ca3af;
}

/* Radio disembunyikan, label yang jadi tombol */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@keyframes float {
  0%, 100% { transform: scaleX(-1) translateY(0); }
  50% { transform: scaleX(-1) translateY(-10px); }
}
.animate-float { animation: float 3s ease-in-out infinite; }

@media (prefers-reduced-motion: reduce) {
  .shimmer::after,
  .animate-float { animation: none; }
}
</style>