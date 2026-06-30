<script setup lang="ts">
import { computed, onMounted, onUnmounted, nextTick, watch, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useComponentCMS } from '@/composables/useComponentCMS'
import NoImagePlaceholder from '@/components/NoImagePlaceholder.vue'

const router = useRouter()
const cms = useComponentCMS('ToursSection')

const EXPEDITION_FAMILIES = [
  {
    key: 'ocean-safari',
    slotIndex: 1,
    title: 'Ocean Safari',
    vessel: 'Aboard Sylfia',
    nights: '5 Nights',
    days: '6 Days',
    description: 'Our signature sailing, snorkelling and wildlife expedition.',
    features: [
      { icon: 'sail', label: 'Sailing' },
      { icon: 'snorkel', label: 'Snorkelling' },
      { icon: 'wildlife', label: 'Wildlife' },
      { icon: 'beach', label: 'Beaches' },
      { icon: 'sunset', label: 'Private Chef' },
    ],
    link: '/expeditions/ocean-safari',
    viewLabel: 'VIEW EXPEDITION',
    escape: {
      key: 'ocean-safari-escape',
      slotIndex: 2,
      title: 'Ocean Safari Escape',
      nights: '3 Nights',
      days: '4 Days',
      text: 'Also available:',
      link: '/expeditions/ocean-safari-escape',
    },
  },
  {
    key: 'dive-expedition',
    slotIndex: 0,
    title: 'Dive Expedition',
    vessel: 'Aboard Millennium',
    nights: '8 Nights',
    days: '9 Days',
    description: 'Our flagship liveaboard dive and snorkel expedition.',
    features: [
      { icon: 'sail', label: 'Sailing' },
      { icon: 'dive', label: 'Scuba Diving' },
      { icon: 'whale', label: 'WhaleSharks' },
      { icon: 'coral', label: 'Wild Life' },
      { icon: 'camera', label: 'Private Chef' },
    ],
    link: '/expeditions/dive-expedition',
    viewLabel: 'VIEW EXPEDITION',
    escape: {
      key: 'dive-escape',
      slotIndex: 3,
      title: 'Dive Escape',
      nights: '4 Nights',
      days: '5 Days',
      text: 'Selected dates only:',
      link: '/expeditions/dive-escape',
    },
  },
]

const expeditions = computed(() => {
  return EXPEDITION_FAMILIES.map((family) => {
    const mainCms = cms.getSlot('tourCards', family.slotIndex)
    return {
      ...family,
      image: mainCms?.imageUrl || '',
      hasImage: !!mainCms?.imageUrl,
    }
  })
})

const scrollerRef = ref<HTMLElement | null>(null)
const activeIndex = ref(0)
let scrollTicking = false

function onCarouselScroll() {
  if (scrollTicking) return
  scrollTicking = true
  requestAnimationFrame(() => {
    const el = scrollerRef.value
    if (el) {
      const cardWidth = el.scrollWidth / expeditions.value.length
      activeIndex.value = Math.round(el.scrollLeft / cardWidth)
    }
    scrollTicking = false
  })
}

function scrollToCard(index: number) {
  const el = scrollerRef.value
  if (!el) return
  const card = el.children[index] as HTMLElement | undefined
  card?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
}

let observer: IntersectionObserver | null = null

function setupObserver() {
  if (!observer) {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('show')
          }
        })
      },
      { threshold: 0.06 }
    )
  }

  document.querySelectorAll('.tour-card.reveal:not(.show)').forEach((el) =>
    observer?.observe(el)
  )
}

onMounted(async () => {
  await nextTick()
  setupObserver()
  cms.load()
})

watch(
  () => cms.items.value,
  async () => {
    await nextTick()
    setupObserver()
  }
)

onUnmounted(() => {
  observer?.disconnect()
})
</script>

<template>
  <section class="tours-section">
    <div class="tours-grid" ref="scrollerRef" @scroll="onCarouselScroll">
      <div
        v-for="(item, index) in expeditions"
        :key="item.key"
        class="tour-card reveal"
        :style="{ transitionDelay: `${index * 0.15}s` }"
      >
        <div class="card-image-panel">
          <template v-if="item.hasImage">
            <img :src="item.image" :alt="item.title" />
          </template>
          <NoImagePlaceholder v-else :label="item.title" />
          <div class="image-overlay"></div>
        </div>

        <div class="card-content-panel">
          <div class="product-icon">
            <svg
              v-if="item.key === 'ocean-safari'"
              width="48"
              height="48"
              viewBox="0 0 100 100"
              fill="none"
            >
              <ellipse cx="50" cy="52" rx="18" ry="12" stroke="#C9A84C" stroke-width="1.5" />
              <ellipse cx="50" cy="50" rx="10" ry="8" fill="none" stroke="#C9A84C" stroke-width="1.2" />
              <path d="M32 52 Q22 44 26 36 Q34 42 32 52Z" stroke="#C9A84C" stroke-width="1.2" fill="none" />
              <path d="M68 52 Q78 44 74 36 Q66 42 68 52Z" stroke="#C9A84C" stroke-width="1.2" fill="none" />
              <path d="M34 60 Q26 70 30 76 Q38 68 34 60Z" stroke="#C9A84C" stroke-width="1.2" fill="none" />
              <path d="M66 60 Q74 70 70 76 Q62 68 66 60Z" stroke="#C9A84C" stroke-width="1.2" fill="none" />
              <ellipse cx="50" cy="34" rx="8" ry="6" stroke="#C9A84C" stroke-width="1.5" />
              <circle cx="47" cy="32" r="1.5" fill="#C9A84C" />
            </svg>

            <svg v-else width="48" height="48" viewBox="0 0 100 100" fill="none">
              <path
                d="M50 50 C30 30 10 45 15 60 C20 72 40 65 50 60 C60 65 80 72 85 60 C90 45 70 30 50 50Z"
                stroke="#C9A84C"
                stroke-width="1.5"
                fill="none"
              />
              <path d="M50 60 L50 82 Q53 78 50 72 Q47 78 50 82" stroke="#C9A84C" stroke-width="1.2" fill="none" />
              <circle cx="44" cy="55" r="2" fill="#C9A84C" opacity="0.7" />
            </svg>
          </div>

          <h3 class="product-title">{{ item.title }}</h3>
          <p class="product-vessel">{{ item.vessel }}</p>

          <div class="product-divider">
            <div class="divider-line-short"></div>
          </div>

          <p class="product-duration">{{ item.nights }} | {{ item.days }}</p>
          <p class="product-description">{{ item.description }}</p>

          <div class="feature-icons">
            <div v-for="feat in item.features" :key="feat.label" class="feat-item">
              <svg
                v-if="feat.icon === 'sail'"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path d="M12 3v13M12 3C12 3 5 9 5 16h7" stroke="#C9A84C" stroke-width="1.4" stroke-linecap="round" />
                <path d="M3 19h18" stroke="#C9A84C" stroke-width="1.4" stroke-linecap="round" />
              </svg>

              <svg
                v-else-if="feat.icon === 'snorkel'"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle cx="12" cy="9" r="4" stroke="#C9A84C" stroke-width="1.4" />
                <path d="M8 13c0 4 8 4 8 0" stroke="#C9A84C" stroke-width="1.4" />
                <path d="M7 7c-2-2-4 0-3 3" stroke="#C9A84C" stroke-width="1.4" stroke-linecap="round" />
              </svg>

              <svg
                v-else-if="feat.icon === 'wildlife'"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path d="M12 14c-3 0-6 2-6 4v1h12v-1c0-2-3-4-6-4z" stroke="#C9A84C" stroke-width="1.4" />
                <circle cx="12" cy="9" r="4" stroke="#C9A84C" stroke-width="1.4" />
                <path d="M3 8c1-3 4-3 5-1M16 7c1-2 4-2 5 1" stroke="#C9A84C" stroke-width="1.4" stroke-linecap="round" />
              </svg>

              <svg
                v-else-if="feat.icon === 'beach'"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path d="M4 20h16M12 20V8M12 8c0 0-3-5 0-7 3 2 0 7 0 7z" stroke="#C9A84C" stroke-width="1.4" stroke-linecap="round" />
                <path d="M12 10c0 0 5 2 7 0" stroke="#C9A84C" stroke-width="1.4" stroke-linecap="round" />
                <path d="M12 13c0 0-5 2-7 0" stroke="#C9A84C" stroke-width="1.4" stroke-linecap="round" />
              </svg>

              <svg
                v-else-if="feat.icon === 'sunset'"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path d="M3 17h18M8 17A4 4 0 0 1 16 17" stroke="#C9A84C" stroke-width="1.4" stroke-linecap="round" />
                <path d="M12 9V6M5.5 11.5L7 10M18.5 11.5L17 10" stroke="#C9A84C" stroke-width="1.4" stroke-linecap="round" />
              </svg>

              <svg
                v-else-if="feat.icon === 'dive'"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path d="M9 4h6v4H9z" stroke="#C9A84C" stroke-width="1.3" />
                <rect x="8" y="8" width="8" height="10" rx="1" stroke="#C9A84C" stroke-width="1.4" />
                <path
                  d="M7 10H5a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h2M17 10h2a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-2"
                  stroke="#C9A84C"
                  stroke-width="1.3"
                />
              </svg>

              <svg
                v-else-if="feat.icon === 'whale'"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path d="M4 14c0-4 3-7 8-7s8 3 8 6v2c0 1-1 2-2 2H6c-1 0-2-1-2-2v-1z" stroke="#C9A84C" stroke-width="1.4" />
                <path d="M18 15c2-1 4-1 4 1l-2 3" stroke="#C9A84C" stroke-width="1.4" stroke-linecap="round" />
                <circle cx="9" cy="12" r="1" fill="#C9A84C" />
                <path d="M12 7 Q14 3 18 5" stroke="#C9A84C" stroke-width="1.2" stroke-linecap="round" fill="none" />
              </svg>

              <svg
                v-else-if="feat.icon === 'manta'"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M12 12 C8 8 3 10 4 14 C5 17 9 16 12 14 C15 16 19 17 20 14 C21 10 16 8 12 12Z"
                  stroke="#C9A84C"
                  stroke-width="1.4"
                  fill="none"
                />
                <path d="M12 14 L12 19" stroke="#C9A84C" stroke-width="1.2" stroke-linecap="round" />
              </svg>

              <svg
                v-else-if="feat.icon === 'coral'"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M12 20V12M12 12 Q9 8 9 4M12 12 Q15 8 15 4M12 12 Q7 10 5 12M12 12 Q17 10 19 12"
                  stroke="#C9A84C"
                  stroke-width="1.4"
                  stroke-linecap="round"
                />
              </svg>

              <svg
                v-else-if="feat.icon === 'camera'"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
              >
                <rect x="3" y="8" width="18" height="12" rx="2" stroke="#C9A84C" stroke-width="1.4" />
                <circle cx="12" cy="14" r="3" stroke="#C9A84C" stroke-width="1.4" />
                <path d="M8.5 8L10 5.5h4L15.5 8" stroke="#C9A84C" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
              </svg>

              <span class="feat-label">{{ feat.label }}</span>
            </div>
          </div>

          <div class="card-actions">
            <button class="btn-primary-gold" @click="router.push(item.link)">
              {{ item.viewLabel }}
            </button>
            <button class="btn-outline-white" @click="router.push('/dates')">
              SEE DATES
            </button>
          </div>
        </div>

        <div class="escape-strip">
          <span class="escape-prefix">{{ item.escape.text }}</span>
          <span class="escape-title">{{ item.escape.title }}</span>
          <span class="escape-sep">—</span>
          <span class="escape-duration">{{ item.escape.nights }} | {{ item.escape.days }}</span>
          <button class="btn-escape" @click="router.push(item.escape.link)">
            VIEW ESCAPE
          </button>
        </div>
      </div>
    </div>

    <div class="tours-dots" aria-hidden="true">
      <button
        v-for="(item, index) in expeditions"
        :key="item.key + '-dot'"
        class="tours-dot"
        :class="{ active: activeIndex === index }"
        @click="scrollToCard(index)"
      ></button>
    </div>
  </section>
</template>

<style scoped>
.tours-section {
  width: 100%;
  background: transparent;
  padding: 2.5rem 0 3rem;
  box-sizing: border-box;
}

.tours-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.25rem;
}

.tour-card {
  position: relative;
  display: grid;
  grid-template-columns: 38% 62%;
  grid-template-rows: 1fr auto;
  border: 1px solid rgba(201, 168, 76, 0.4);
  border-radius: 6px;
  overflow: hidden;
  background: #06162a;
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.55s ease, transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.3s ease, box-shadow 0.4s ease;
  min-height: 420px;
}

.tour-card.show {
  opacity: 1;
  transform: translateY(0);
}

.tour-card:hover {
  border-color: #c9a84c;
  transform: translateY(-6px);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(201, 168, 76, 0.15);
}

.card-image-panel {
  grid-row: 1;
  grid-column: 1;
  position: relative;
  overflow: hidden;
}

.card-image-panel img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 8s ease;
}

.tour-card:hover .card-image-panel img {
  transform: scale(1.04);
}

.image-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to right, transparent 60%, rgba(6, 22, 42, 0.5) 100%);
}

.card-content-panel {
  grid-row: 1;
  grid-column: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 1.75rem 1.5rem 1.25rem;
  border-left: 1px solid rgba(201, 168, 76, 0.15);
}

.product-icon {
  margin-bottom: 0.75rem;
  opacity: 0.9;
}

.product-title {
  font-family: var(--font-display);
  color: #f8f5ef;
  font-size: clamp(1.4rem, 2vw, 2rem);
  font-weight: 400;
  letter-spacing: 0.02em;
  line-height: 1.1;
  margin-bottom: 0.35rem;
}

.product-vessel {
  color: #c9a84c;
  font-style: italic;
  font-size: 0.9rem;
  letter-spacing: 0.04em;
  margin-bottom: 0.75rem;
}

.product-divider {
  display: flex;
  justify-content: center;
  margin-bottom: 0.75rem;
}

.divider-line-short {
  width: 48px;
  height: 1px;
  background: rgba(201, 168, 76, 0.4);
}

.product-duration {
  color: #c9a84c;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  margin-bottom: 0.6rem;
}

.product-description {
  color: rgba(248, 245, 239, 0.75);
  font-size: 0.85rem;
  line-height: 1.55;
  max-width: 260px;
  margin-bottom: 1.1rem;
}

.feature-icons {
  display: flex;
  justify-content: center;
  gap: 0.6rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}

.feat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  min-width: 44px;
}

.feat-label {
  color: rgba(248, 245, 239, 0.6);
  font-size: 0.58rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  text-align: center;
  white-space: pre-line;
  line-height: 1.2;
}

.card-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: auto;
}

.btn-primary-gold {
  height: 40px;
  padding: 0 1.2rem;
  background: #c9a84c;
  border: none;
  color: #071a2b;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  cursor: pointer;
  border-radius: 2px;
  transition: background 0.3s ease;
  white-space: nowrap;
}

.btn-primary-gold:hover {
  background: #d7b461;
}

.btn-outline-white {
  height: 40px;
  padding: 0 1.2rem;
  background: transparent;
  border: 1px solid rgba(248, 245, 239, 0.55);
  color: #f8f5ef;
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  cursor: pointer;
  border-radius: 2px;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.btn-outline-white:hover {
  border-color: #f8f5ef;
  background: rgba(248, 245, 239, 0.08);
}

.escape-strip {
  grid-column: 1 / -1;
  grid-row: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.65rem 1.25rem;
  border-top: 1px solid rgba(201, 168, 76, 0.2);
  background: rgba(4, 14, 28, 0.6);
  flex-wrap: wrap;
}

.escape-prefix {
  color: rgba(248, 245, 239, 0.6);
  font-size: 0.72rem;
}

.escape-title {
  color: #c9a84c;
  font-family: var(--font-display);
  font-style: italic;
  font-size: 0.85rem;
  font-weight: 500;
}

.escape-sep {
  color: rgba(248, 245, 239, 0.4);
  font-size: 0.72rem;
}

.escape-duration {
  color: rgba(248, 245, 239, 0.7);
  font-size: 0.72rem;
  letter-spacing: 0.04em;
}

.btn-escape {
  padding: 5px 14px;
  background: transparent;
  border: 1px solid rgba(201, 168, 76, 0.55);
  color: #c9a84c;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  cursor: pointer;
  border-radius: 2px;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.btn-escape:hover {
  background: rgba(201, 168, 76, 0.12);
  border-color: #c9a84c;
}

.tours-dots {
  display: none;
}

@media (max-width: 768px) {
  .tours-dots {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  .tours-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    border: none;
    background: rgba(201, 168, 76, 0.3);
    padding: 0;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .tours-dot.active {
    background: #c9a84c;
    width: 22px;
    border-radius: 4px;
  }
}

@media (max-width: 1100px) {
  .tours-grid {
    grid-template-columns: 1fr;
  }

  .tour-card {
    min-height: 380px;
  }
}

@media (max-width: 768px) {
  .tours-section {
    padding: 2rem 0 2.5rem;
  }

  .tours-grid {
    display: flex;
    grid-template-columns: unset;
    gap: 1rem;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    padding: 0.25rem 1.25rem 1.25rem;
    margin: 0 -1.25rem;
    scrollbar-width: none;
  }

  .tours-grid::-webkit-scrollbar {
    display: none;
  }

  .tour-card {
    grid-template-columns: 1fr;
    grid-template-rows: 220px 1fr auto;
    min-height: unset;
    flex: 0 0 88%;
    scroll-snap-align: center;
    scroll-snap-stop: always;
  }

  .card-image-panel {
    grid-row: 1;
    grid-column: 1;
    height: 220px;
  }

  .card-content-panel {
    grid-row: 2;
    grid-column: 1;
    border-left: none;
    border-top: 1px solid rgba(201, 168, 76, 0.15);
  }

  .escape-strip {
    grid-row: 3;
    grid-column: 1;
  }

  .product-description {
    max-width: 100%;
  }
}

@media (max-width: 480px) {
  .card-content-panel {
    padding: 1.25rem 1rem 1rem;
  }

  .feature-icons {
    gap: 0.5rem;
  }

  .feat-item {
    min-width: 38px;
  }

  .card-actions {
    gap: 0.6rem;
  }

  .btn-primary-gold,
  .btn-outline-white {
    width: 100%;
    justify-content: center;
  }

  .escape-strip {
    flex-direction: column;
    align-items: center;
    gap: 0.35rem;
  }

  .btn-escape {
    align-self: center;
  }
}
</style>