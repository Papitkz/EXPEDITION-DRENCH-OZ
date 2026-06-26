<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSEO } from '@/composables/useSEO'
import { useComponentCMS } from '@/composables/useComponentCMS'
import { useLimitedExpeditionData } from '@/composables/useLimitedExpeditionData'
import PageHero from '@/components/PageHero.vue'
import NoImagePlaceholder from '@/components/NoImagePlaceholder.vue'

const route = useRoute()
const router = useRouter()

const slug = computed(() => route.params.slug as string)

const tripData = useLimitedExpeditionData(slug.value)
const cms = useComponentCMS('LimitedExpeditionDetail')

const GALLERY_SLOTS = 6
const ITINERARY_SLOTS_MAX = 9

function sectionKey(field: string) {
  return `${slug.value}_${field}`
}

const heroImage = computed(() => cms.getImageUrl(sectionKey('hero'), 0) || tripData.heroImageUrl.value)
const aboutImage = computed(() => cms.getImageUrl(sectionKey('about'), 0))

const galleryImages = computed(() =>
  Array.from({ length: GALLERY_SLOTS }, (_, i) => {
    const item = cms.getSlot(sectionKey('gallery'), i)
    return {
      src: item?.imageUrl || '',
      caption: item?.caption || item?.title || '',
      hasImage: !!item?.imageUrl,
    }
  }).filter((img) => img.hasImage)
)

const itinerary = computed(() => {
  // Prefer live Firestore itinerary days (admin-managed), else fall back to
  // CMS image slots layered on a generic day structure, else show nothing.
  if (tripData.itinerary.value.length > 0) {
    return tripData.itinerary.value.map((d) => ({
      day: `Day ${d.dayNumber}`,
      title: d.title,
      desc: d.description,
      image: d.imageUrl,
      hasImage: !!d.imageUrl,
    }))
  }
  return Array.from({ length: Math.min(tripData.nights.value + 1, ITINERARY_SLOTS_MAX) }, (_, i) => {
    const item = cms.getSlot(sectionKey('itinerary'), i)
    return {
      day: `Day ${i + 1}`,
      title: item?.title || '',
      desc: item?.description || '',
      image: item?.imageUrl || '',
      hasImage: !!item?.imageUrl,
    }
  }).filter((d) => d.title || d.desc || d.hasImage)
})

function goEnquire() {
  router.push({
    path: '/contact',
    query: {
      expedition: tripData.title.value,
      dates: tripData.dateLabel.value,
    },
  })
}

let observer: IntersectionObserver | null = null

onMounted(async () => {
  await Promise.all([tripData.load(), cms.load()])

  observer = new IntersectionObserver(
    (entries) => entries.forEach((en) => { if (en.isIntersecting) en.target.classList.add('visible') }),
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  )
  document.querySelectorAll('.section-reveal, .section-reveal-left, .section-reveal-right').forEach((el) => observer?.observe(el))
})

onUnmounted(() => observer?.disconnect())

useSEO({
  title: `${tripData.title.value} — Expedition OZ`,
  description: tripData.shortDescription.value || tripData.description.value,
  path: `/limited-expeditions/${slug.value}`,
  type: 'product',
})
</script>

<template>
  <div v-if="tripData.exists.value">
    <!-- Hero -->
    <PageHero
      component-name="LimitedExpeditionDetailView"
      tag="Limited Expedition"
      :title="tripData.title.value"
      :title-italic="tripData.subtitle.value"
      :subtitle="tripData.host.value ? `Hosted by ${tripData.host.value}` : ''"
      :image="heroImage"
      :image-alt="tripData.title.value"
      height="70vh"
    >
      <template v-if="!heroImage">
        <NoImagePlaceholder dark class="absolute inset-0 w-full h-full" />
      </template>
    </PageHero>

    <!-- Quick facts bar -->
    <section class="facts-bar">
      <div class="facts-inner">
        <router-link to="/limited-expeditions" class="back-link">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
          All Limited Expeditions
        </router-link>
        <div class="facts-row">
          <div class="fact">
            <span class="fact-value">{{ tripData.nights.value }}</span>
            <span class="fact-label">Nights</span>
          </div>
          <div class="fact-divider"></div>
          <div class="fact">
            <span class="fact-value">{{ tripData.vesselName.value }}</span>
            <span class="fact-label">Vessel</span>
          </div>
          <div class="fact-divider"></div>
          <div class="fact">
            <span class="fact-value">{{ tripData.dateLabel.value }}</span>
            <span class="fact-label">Departure</span>
          </div>
          <div class="fact-divider"></div>
          <div class="fact">
            <span class="fact-value gold">{{ tripData.priceLabel.value }}</span>
            <span class="fact-label">Per Person</span>
          </div>
        </div>
        <button class="btn-primary enquire-btn" @click="goEnquire">Enquire About This Expedition</button>
      </div>
    </section>

    <!-- About -->
    <section class="py-12 md:py-24" style="background: var(--color-ocean-950);">
      <div class="container mx-auto px-4 sm:px-6 lg:px-12">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-12 lg:gap-16 items-center">
          <div class="section-reveal-left">
            <p class="overline-text mb-2 md:mb-4 text-xs md:text-sm">About This Expedition</p>
            <div class="gold-divider-left mb-3 md:mb-6"></div>
            <h2 class="font-display text-2xl md:text-4xl lg:text-5xl font-light mb-3 md:mb-6" style="font-family: var(--font-display); color: var(--color-sand-100);">
              {{ tripData.subtitle.value }}
            </h2>
            <p class="text-sm md:text-base leading-relaxed mb-4 md:mb-6 opacity-80" style="font-family: var(--font-body); color: var(--color-sand-200); line-height: 1.9;">
              {{ tripData.description.value }}
            </p>
            <p v-if="tripData.host.value" class="hosted-by">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a8 8 0 0 1 16 0v1"/></svg>
              Hosted by {{ tripData.host.value }}
            </p>
            <button class="btn-primary mt-4" @click="goEnquire">Reserve Your Place</button>
          </div>

          <div class="section-reveal-right">
            <div class="relative overflow-hidden h-[250px] sm:h-[350px] md:h-[480px]">
              <template v-if="aboutImage">
                <img :src="aboutImage" :alt="tripData.title.value" class="w-full h-full object-cover" />
              </template>
              <NoImagePlaceholder v-else label="No About Image" />
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Gallery (only if CMS images exist) -->
    <section v-if="galleryImages.length" class="py-12 md:py-24" style="background: var(--color-ocean-900);">
      <div class="container mx-auto px-4 sm:px-6 lg:px-12">
        <div class="text-center mb-8 md:mb-16 section-reveal">
          <p class="overline-text mb-2 md:mb-4 text-xs md:text-sm">Gallery</p>
          <div class="gold-divider mb-3 md:mb-6 mx-auto"></div>
          <h2 class="font-display text-2xl md:text-4xl font-light" style="font-family: var(--font-display); color: var(--color-sand-100);">
            A Glimpse <span class="italic" style="color: var(--color-gold-400);">In</span>
          </h2>
        </div>

        <div class="columns-2 md:columns-3 gap-2 md:gap-3 space-y-2 md:space-y-3 section-reveal">
          <div v-for="(img, i) in galleryImages" :key="i" class="relative overflow-hidden break-inside-avoid mb-2 md:mb-3 group">
            <img :src="img.src" :alt="img.caption" class="w-full h-auto object-cover" />
            <div v-if="img.caption" class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
              <p class="text-white font-display text-sm">{{ img.caption }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Itinerary (only if data exists) -->
    <section v-if="itinerary.length" class="py-12 md:py-24" style="background: var(--color-ocean-950);">
      <div class="container mx-auto px-4 sm:px-6 lg:px-12 max-w-6xl">
        <div class="text-center mb-12 md:mb-20 section-reveal">
          <p class="overline-text mb-2 md:mb-4 text-xs md:text-sm">Day by Day</p>
          <div class="gold-divider mb-4 md:mb-6 mx-auto"></div>
          <h2 class="font-display text-2xl md:text-4xl lg:text-5xl font-light" style="font-family: var(--font-display); color: var(--color-sand-100);">
            Your <span class="italic" style="color: var(--color-gold-400);">Itinerary</span>
          </h2>
        </div>

        <div class="relative">
          <div class="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-[#C9A84C]/30 via-[#C9A84C]/50 to-[#C9A84C]/30 md:-translate-x-1/2"></div>

          <div v-for="(item, index) in itinerary" :key="index" class="relative mb-8 md:mb-16 section-reveal">
            <div class="absolute left-4 md:left-1/2 top-0 w-10 h-10 md:w-14 md:h-14 bg-[#C9A84C] flex items-center justify-center z-20 md:-translate-x-1/2">
              <span class="font-display text-xs md:text-sm font-bold text-[#0A2E4A]">{{ index + 1 }}</span>
            </div>

            <div class="ml-14 md:ml-0 md:grid md:grid-cols-2 md:gap-8 lg:gap-12">
              <div class="mb-4 md:mb-0" :class="index % 2 === 0 ? 'md:order-1 md:pr-8 lg:pr-12' : 'md:order-2 md:pl-8 lg:pl-12'">
                <div class="relative overflow-hidden h-48 sm:h-56 md:h-72">
                  <template v-if="item.hasImage">
                    <img :src="item.image" :alt="item.title" class="w-full h-full object-cover" />
                  </template>
                  <NoImagePlaceholder v-else :label="item.day" class="w-full h-full" />
                </div>
              </div>

              <div class="flex flex-col justify-center" :class="index % 2 === 0 ? 'md:order-2 md:pl-8 lg:pl-12' : 'md:order-1 md:pr-8 lg:pr-12 md:text-right'">
                <p class="overline-text text-[10px] md:text-xs mb-2 md:mb-3">{{ item.day }}</p>
                <h3 class="font-display text-xl md:text-2xl lg:text-3xl font-light mb-3 md:mb-4" style="font-family: var(--font-display); color: var(--color-sand-100);">
                  {{ item.title }}
                </h3>
                <div class="w-8 h-px bg-[#C9A84C]/40 mb-3 md:mb-4" :class="index % 2 === 1 ? 'md:ml-auto' : ''"></div>
                <p class="text-sm md:text-base leading-relaxed opacity-75" style="font-family: var(--font-body); color: var(--color-sand-200); line-height: 1.8;">
                  {{ item.desc }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Closing CTA -->
    <section class="cta-band">
      <div class="cta-band-inner">
        <p class="overline-text mb-3">{{ tripData.dateLabel.value }}</p>
        <h2 class="font-display text-2xl md:text-4xl font-light mb-4" style="font-family: var(--font-display); color: var(--color-sand-100);">
          Spaces are <span class="italic" style="color: var(--color-gold-400);">Limited</span>
        </h2>
        <p class="cta-band-text">
          This is a one-off, date-specific departure. Enquire now to check availability and secure your place aboard {{ tripData.vesselName.value }}.
        </p>
        <button class="btn-primary" @click="goEnquire">Enquire Now</button>
      </div>
    </section>
  </div>

  <!-- Not found -->
  <div v-else class="not-found-state">
    <p class="overline-text mb-4">Limited Expedition</p>
    <h1 class="font-display text-3xl md:text-4xl font-light mb-4" style="color: var(--color-sand-100);">We couldn't find that expedition</h1>
    <router-link to="/limited-expeditions" class="btn-primary">View All Limited Expeditions</router-link>
  </div>
</template>

<style scoped>
.facts-bar {
  background: rgba(7, 26, 43, 0.97);
  border-bottom: 1px solid rgba(201, 168, 76, 0.15);
  padding: 1.5rem 1.5rem;
}

.facts-inner {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1.25rem;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: rgba(248, 245, 239, 0.6);
  text-decoration: none;
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  transition: color 0.2s ease;
  flex-shrink: 0;
}

.back-link:hover {
  color: #c9a84c;
}

.facts-row {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  flex-wrap: wrap;
}

.fact {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 60px;
}

.fact-value {
  font-family: var(--font-display);
  font-size: 1.1rem;
  color: #f8f5ef;
  font-weight: 500;
  white-space: nowrap;
}

.fact-value.gold {
  color: #c9a84c;
}

.fact-label {
  font-size: 0.58rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(248, 245, 239, 0.4);
}

.fact-divider {
  width: 1px;
  height: 28px;
  background: rgba(201, 168, 76, 0.2);
}

.enquire-btn {
  flex-shrink: 0;
}

.hosted-by {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 1rem;
  font-size: 0.85rem;
  color: rgba(248, 245, 239, 0.75);
  font-family: var(--font-heading);
}

.cta-band {
  background: linear-gradient(180deg, rgba(10, 46, 74, 0.6), rgba(7, 26, 43, 1));
  padding: 4rem 1.5rem;
  text-align: center;
  border-top: 1px solid rgba(201, 168, 76, 0.15);
}

.cta-band-inner {
  max-width: 560px;
  margin: 0 auto;
}

.cta-band-text {
  color: rgba(248, 245, 239, 0.75);
  font-size: 0.95rem;
  line-height: 1.7;
  margin-bottom: 1.75rem;
}

.not-found-state {
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 4rem 1.5rem;
  background: var(--color-ocean-950);
  gap: 0.5rem;
}

@media (max-width: 768px) {
  .facts-inner {
    flex-direction: column;
    align-items: flex-start;
  }

  .facts-row {
    gap: 1rem;
  }

  .fact-divider {
    display: none;
  }

  .enquire-btn {
    width: 100%;
  }
}
</style>
