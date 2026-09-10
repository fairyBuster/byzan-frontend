<script setup>
/**
 * FloatingChatWidget.vue
 *
 * Floating chat ala admin CS: nyapa, tawarin topik, lalu lanjut ke WhatsApp
 * dengan pesan yang sudah di-prefill. Nada bahasanya dibuat seperti admin
 * manusia, bukan bot/AI.
 */
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { X, Send, ChevronLeft } from 'lucide-vue-next'
import { getAssetUrl } from '../utils/assets'

const props = defineProps({
  phone: { type: String, default: '6285199111442' },
  agentName: { type: String, default: 'Byzan Education' },
  agentRole: { type: String, default: 'Admin' },
  teaserDelay: { type: Number, default: 6000 },
})

const logoSrc = getAssetUrl('byzantiumlogo.png')

const isOpen = ref(false)
const isTyping = ref(false)
const showTeaser = ref(false)
const hasInteracted = ref(false)
const messages = ref([])
const customText = ref('')
const scrollAreaRef = ref(null)

let timers = []
const later = (fn, ms) => {
  const id = setTimeout(fn, ms)
  timers.push(id)
  return id
}
const clearTimers = () => {
  timers.forEach(clearTimeout)
  timers = []
}

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 11) return 'Selamat pagi'
  if (h < 15) return 'Selamat siang'
  if (h < 18) return 'Selamat sore'
  return 'Selamat malam'
})

// Timestamp bubble biar terasa seperti chat sungguhan
const clock = () =>
  new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

const topics = [
  {
    id: 'course',
    label: 'Kelas & pendaftaran',
    reply:
      'Untuk kelas, kami ada beberapa program kitab yang jalan rutin, termasuk Jurumiyah 8 sesi. Detail jadwal dan biayanya kami kirim lewat WhatsApp ya.',
    waMessage:
      'Halo Byzan Edu, saya ingin bertanya mengenai kelas di Byzan Course (jadwal, biaya, dan cara pendaftaran).',
  },
  {
    id: 'pedia',
    label: 'Terbitkan naskah',
    reply:
      'Naskah siap cetak bisa langsung kami proses. Kalau belum rapi pun tidak masalah, tim kami bisa bantu penulisan ulang, layout, sampai desain sampul.',
    waMessage:
      'Halo Byzan Edu, saya ingin bertanya mengenai penerbitan naskah di Byzan Pedia.',
  },
  {
    id: 'post',
    label: 'Kirim artikel',
    reply:
      'Boleh, kami terbuka untuk artikel dan kajian. Kirim saja draftnya, nanti tim redaksi yang review dan kabari hasilnya.',
    waMessage:
      'Halo Byzan Edu, saya ingin mengirim artikel untuk dimuat di Byzan Post.',
  },
  {
    id: 'other',
    label: 'Kerja sama / lainnya',
    reply:
      'Baik, untuk kerja sama atau pertanyaan lain kami bantu langsung. Silakan lanjut ke WhatsApp supaya lebih enak diskusinya.',
    waMessage:
      'Halo Byzan Edu, saya ingin berdiskusi mengenai kerja sama dengan Byzan Education.',
  },
]

const waLink = (text) => `https://wa.me/${props.phone}?text=${encodeURIComponent(text)}`

const scrollToBottom = async () => {
  await nextTick()
  const el = scrollAreaRef.value
  if (el) el.scrollTop = el.scrollHeight
}

const pushAgent = (text, opts = {}) => {
  messages.value.push({ id: Date.now() + Math.random(), from: 'agent', text, time: clock(), ...opts })
  scrollToBottom()
}

const pushUser = (text) => {
  messages.value.push({ id: Date.now() + Math.random(), from: 'user', text, time: clock() })
  scrollToBottom()
}

const agentSay = (text, delay = 900, opts = {}) => {
  isTyping.value = true
  scrollToBottom()
  later(() => {
    isTyping.value = false
    pushAgent(text, opts)
  }, delay)
}

const startConversation = () => {
  if (messages.value.length > 0) return
  agentSay(`${greeting.value}, terima kasih sudah menghubungi Byzan Education 🙏`, 600)
  agentSay('Ada yang bisa kami bantu? Pilih salah satu di bawah, atau tulis langsung pertanyaannya.', 1900, {
    showTopics: true,
  })
}

const openChat = () => {
  isOpen.value = true
  showTeaser.value = false
  hasInteracted.value = true
  startConversation()
  scrollToBottom()
}

const closeChat = () => {
  isOpen.value = false
}

const selectTopic = (topic) => {
  pushUser(topic.label)
  agentSay(topic.reply, 1200, { cta: topic.waMessage })
}

const resetChat = () => {
  clearTimers()
  isTyping.value = false
  messages.value = []
  customText.value = ''
  startConversation()
}

const sendCustom = () => {
  const text = String(customText.value || '').trim()
  if (!text) return
  pushUser(text)
  customText.value = ''
  agentSay(
    'Baik, pesannya sudah kami terima. Lanjut ke WhatsApp ya supaya bisa kami jawab lebih lengkap 👇',
    1200,
    { cta: `Halo Byzan Edu, ${text}` },
  )
}

const openWhatsApp = (text) => {
  window.open(waLink(text), '_blank', 'noopener,noreferrer')
}

const handleEsc = (e) => {
  if (e.key === 'Escape' && isOpen.value) closeChat()
}

onMounted(() => {
  window.addEventListener('keydown', handleEsc)
  if (props.teaserDelay > 0) {
    later(() => {
      if (!hasInteracted.value) showTeaser.value = true
    }, props.teaserDelay)
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleEsc)
  clearTimers()
})
</script>

<template>
  <div class="chat-widget font-montserrat">
    <!-- ===== Panel Chat ===== -->
    <transition name="chat-pop">
      <section v-if="isOpen" class="chat-panel" role="dialog" aria-label="Chat dengan Byzan Education">
        <header class="chat-header">
          <button
            v-if="messages.length > 2"
            type="button"
            class="header-icon-btn"
            aria-label="Mulai ulang percakapan"
            @click="resetChat"
          >
            <ChevronLeft class="w-5 h-5" />
          </button>
          <div class="avatar">
            <img :src="logoSrc" alt="" width="44" height="44" decoding="async" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="agent-name">{{ agentName }}</p>
            <p class="agent-status">
              <span class="dot"></span> {{ agentRole }} · biasanya balas beberapa menit
            </p>
          </div>
          <button type="button" class="header-icon-btn" aria-label="Tutup chat" @click="closeChat">
            <X class="w-5 h-5" />
          </button>
        </header>

        <div ref="scrollAreaRef" class="chat-body">
          <div v-for="msg in messages" :key="msg.id" class="w-full">
            <div :class="['bubble-row', msg.from === 'user' ? 'justify-end' : 'justify-start']">
              <div :class="['bubble', msg.from === 'user' ? 'bubble-user' : 'bubble-agent']">
                {{ msg.text }}
                <span class="bubble-time">{{ msg.time }}</span>
              </div>
            </div>

            <div v-if="msg.showTopics" class="quick-replies">
              <button
                v-for="topic in topics"
                :key="topic.id"
                type="button"
                class="chip"
                @click="selectTopic(topic)"
              >
                {{ topic.label }}
              </button>
            </div>

            <div v-if="msg.cta" class="mt-2 ps-1">
              <button type="button" class="wa-cta" @click="openWhatsApp(msg.cta)">
                <svg viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5" aria-hidden="true">
                  <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.65.07-.3-.15-1.13-.42-2.15-1.33-.79-.71-1.33-1.58-1.48-1.88-.15-.3-.02-.47.13-.62.15-.15.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.62-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.47 0 1.45 1.06 2.86 1.21 3.06.15.2 2.09 3.2 5.07 4.37 2.98 1.16 2.98.77 3.52.72.54-.05 1.75-.71 2-1.4.25-.7.25-1.28.17-1.4-.07-.13-.27-.2-.57-.35z"/>
                  <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.28-1.38a9.88 9.88 0 0 0 4.76 1.21h.01c5.46 0 9.91-4.45 9.91-9.92C21.96 6.45 17.5 2 12.04 2zm0 18.11h-.01c-1.5 0-2.98-.4-4.27-1.17l-.31-.18-3.17.83.85-3.09-.2-.32a8.22 8.22 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.82 2.41a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23z"/>
                </svg>
                Lanjut chat di WhatsApp
              </button>
            </div>
          </div>

          <div v-if="isTyping" class="bubble-row justify-start">
            <div class="bubble bubble-agent typing" aria-label="Sedang mengetik">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>

        <form class="chat-footer" @submit.prevent="sendCustom">
          <input
            v-model="customText"
            type="text"
            class="chat-input"
            placeholder="Tulis pesan..."
            aria-label="Tulis pesan"
            maxlength="500"
          />
          <button type="submit" class="send-btn" :disabled="!customText.trim()" aria-label="Kirim">
            <Send class="w-4 h-4" />
          </button>
        </form>
        <p class="chat-note">Percakapan dilanjutkan di WhatsApp resmi Byzan Education</p>
      </section>
    </transition>

    <!-- ===== Teaser ===== -->
    <transition name="teaser">
      <button v-if="showTeaser && !isOpen" type="button" class="teaser" @click="openChat">
        <img :src="logoSrc" alt="" class="teaser-logo" width="32" height="32" decoding="async" />
        <span class="teaser-text">{{ greeting }}! Ada yang bisa kami bantu?</span>
        <span class="teaser-close" aria-label="Tutup" @click.stop="showTeaser = false">
          <X class="w-3.5 h-3.5" />
        </span>
      </button>
    </transition>

    <!-- ===== Floating Button ===== -->
    <button
      type="button"
      class="fab"
      :class="{ 'fab-open': isOpen }"
      :aria-label="isOpen ? 'Tutup chat' : 'Chat dengan admin Byzan Education'"
      :aria-expanded="isOpen"
      @click="isOpen ? closeChat() : openChat()"
    >
      <span v-if="!isOpen" class="fab-pulse" aria-hidden="true"></span>
      <X v-if="isOpen" class="w-6 h-6 relative z-10" />
      <span v-else class="fab-inner">
        <img :src="logoSrc" alt="" class="fab-logo" width="60" height="60" decoding="async" />
      </span>
      <span v-if="!isOpen && !hasInteracted" class="fab-badge" aria-hidden="true">1</span>
    </button>
  </div>
</template>

<style scoped>
.chat-widget {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 9997;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
  pointer-events: none;
}
.chat-widget > * { pointer-events: auto; }

/* ===== FAB ===== */
.fab {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  padding: 0;
  border: 2px solid #fff;
  border-radius: 999px;
  cursor: pointer;
  color: #fff;
  background: #fff;
  box-shadow: 0 10px 24px rgba(0, 148, 68, 0.32), 0 2px 6px rgba(0, 0, 0, 0.18);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}
/* Clipper terpisah: logo tetap bulat, tapi badge tidak ikut terpotong */
.fab-inner {
  position: relative;
  z-index: 5;
  display: block;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: 999px;
}
.fab-logo {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.fab:hover { transform: translateY(-3px) scale(1.04); }
.fab:active { transform: scale(0.96); }
.fab-open {
  background: #1f2937;
  border-color: #1f2937;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.28);
}
.fab-pulse {
  position: absolute;
  inset: -2px;
  border-radius: 999px;
  background: rgba(22, 163, 74, 0.5);
  animation: fabPulse 2.4s ease-out infinite;
}
@keyframes fabPulse {
  0% { transform: scale(1); opacity: 0.7; }
  70%, 100% { transform: scale(1.5); opacity: 0; }
}
.fab-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  border-radius: 999px;
  background: #ef4444;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  z-index: 20;
  box-shadow: 0 0 0 2px #fff;
}

/* ===== Teaser ===== */
.teaser {
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: 280px;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 16px 16px 4px 16px;
  background: #fff;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.12);
  cursor: pointer;
  text-align: left;
}
.teaser-logo {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: 8px;
  object-fit: cover;
}
.teaser-text {
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
  line-height: 1.35;
}
.teaser-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 999px;
  color: #6b7280;
  background: #f3f4f6;
  flex-shrink: 0;
}

/* ===== Panel ===== */
.chat-panel {
  width: min(370px, calc(100vw - 32px));
  max-height: min(560px, calc(100vh - 130px));
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 22px;
  background: #fff;
  border: 1px solid #e5e7eb;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.22);
}

.chat-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  color: #fff;
  background: linear-gradient(135deg, #009444 0%, #0a5c3f 100%);
}
.avatar {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.18);
}
.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.agent-name {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.2;
}
.agent-status {
  margin: 2px 0 0;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 500;
  opacity: 0.92;
}
.dot {
  width: 7px;
  height: 7px;
  flex-shrink: 0;
  border-radius: 999px;
  background: #64fb5f;
  box-shadow: 0 0 0 3px rgba(100, 251, 95, 0.25);
}
.header-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border: none;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  cursor: pointer;
  transition: background 0.2s ease;
}
.header-icon-btn:hover { background: rgba(255, 255, 255, 0.28); }

.chat-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 14px;
  background: #f4f6f5;
  display: flex;
  flex-direction: column;
  gap: 8px;
  scroll-behavior: smooth;
}
.chat-body::-webkit-scrollbar { width: 6px; }
.chat-body::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 999px; }

.bubble-row { display: flex; width: 100%; }
.bubble {
  position: relative;
  max-width: 82%;
  padding: 9px 13px 16px;
  font-size: 13.5px;
  line-height: 1.5;
  animation: bubbleIn 0.28s ease;
}
.bubble-agent {
  background: #fff;
  color: #1f2937;
  border-radius: 14px 14px 14px 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}
.bubble-user {
  background: #dcf8c6;
  color: #14351f;
  font-weight: 500;
  border-radius: 14px 14px 4px 14px;
}
.bubble-time {
  position: absolute;
  right: 10px;
  bottom: 4px;
  font-size: 9.5px;
  opacity: 0.5;
  font-weight: 500;
}
@keyframes bubbleIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

.typing {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 13px;
}
.typing span {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: #9ca3af;
  animation: typingBounce 1.2s infinite ease-in-out;
}
.typing span:nth-child(2) { animation-delay: 0.15s; }
.typing span:nth-child(3) { animation-delay: 0.3s; }
@keyframes typingBounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
  30% { transform: translateY(-4px); opacity: 1; }
}

.quick-replies {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
  padding-left: 2px;
}
.chip {
  padding: 7px 12px;
  border: 1px solid #009444;
  border-radius: 999px;
  background: #fff;
  color: #009444;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}
.chip:hover { background: #009444; color: #fff; transform: translateY(-1px); }

.wa-cta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: none;
  border-radius: 999px;
  background: #25d366;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 6px 16px rgba(37, 211, 102, 0.35);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.wa-cta:hover { transform: translateY(-2px); box-shadow: 0 10px 22px rgba(37, 211, 102, 0.45); }

.chat-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px 6px;
  background: #fff;
  border-top: 1px solid #eef0f2;
}
.chat-input {
  flex: 1;
  min-width: 0;
  height: 40px;
  padding: 0 14px;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  background: #f4f6f5;
  font-size: 13px;
  font-family: inherit;
  color: #1f2937;
}
.chat-input:focus {
  outline: none;
  border-color: #009444;
  box-shadow: 0 0 0 3px rgba(0, 148, 68, 0.14);
}
.send-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border: none;
  border-radius: 999px;
  background: #009444;
  color: #fff;
  cursor: pointer;
  transition: opacity 0.2s ease;
}
.send-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.chat-note {
  margin: 0;
  padding: 0 14px 10px;
  background: #fff;
  font-size: 10.5px;
  color: #9ca3af;
  text-align: center;
}

.chat-pop-enter-active,
.chat-pop-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
  transform-origin: bottom right;
}
.chat-pop-enter-from,
.chat-pop-leave-to { opacity: 0; transform: translateY(14px) scale(0.94); }

.teaser-enter-active,
.teaser-leave-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.teaser-enter-from,
.teaser-leave-to { opacity: 0; transform: translateX(12px); }

@media (max-width: 480px) {
  .chat-widget { right: 12px; bottom: 12px; }
  .chat-panel { width: calc(100vw - 24px); max-height: calc(100vh - 120px); }
  .fab { width: 54px; height: 54px; }
  .teaser { max-width: calc(100vw - 90px); }
}

@media (prefers-reduced-motion: reduce) {
  .fab-pulse, .typing span, .bubble { animation: none; }
  .fab:hover, .wa-cta:hover, .chip:hover { transform: none; }
}
</style>