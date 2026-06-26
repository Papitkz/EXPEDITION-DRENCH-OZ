<script setup lang="ts">
/**
 * PageHero — full-bleed hero section used by sub-pages.
 *
 * Props
 *   componentName  – CMS component key (e.g. "OceanSafariView")
 *   section        – CMS section key (default "hero")
 *   slot           – which slotIndex carries the hero image (default 0)
 *   fallbackImage  – URL to show when CMS has no image yet
 *   tag / title / titleItalic / subtitle / height — presentational
 *
 * CMS contract
 *   Every page has its own componentName so images are fully isolated.
 *   The hero image slot (slot 0) and optional poster/secondary (slot 1)
 *   are read independently via getSlot().
 *
 * Parallax
 *   The <img> element moves at 0.25× scroll speed using a rAF loop,
 *   giving a smooth 3-D depth effect with no layout jank.
 *   On mobile (<768 px) the effect is disabled for performance.
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useComponentCMS } from '@/composables/useComponentCMS'
import NoImagePlaceholder from '@/components/NoImagePlaceholder.vue'

const props = withDefaults(defineProps<{
  /** Unique CMS component key for this page — keeps image slots isolated */
  componentName?: string
  /** CMS section within that component */
  cmsSection?: string
  /** Which slot index is the hero image */
  cmsSlot?: number
  /** Shown while CMS loads or when no image is uploaded */
  fallbackImage?: string
  fallbackAlt?: string
  tag?: string
  title: string
  titleItalic?: string
  subtitle?: string
  height?: string
}>(), {
  cmsSection: 'hero',
  cmsSlot: 0,
  height: '65vh',
})

// ── CMS ──────────────────────────────────────────────────────────────────────
const cms = props.componentName ? useComponentCMS(props.componentName) : null

const heroImage = computed(() => {
  if (!cms) return props.fallbackImage || ''
  return cms.getImageUrl(props.cmsSection!, props.cmsSlot!) || props.fallbackImage || ''
})

const heroAlt = computed(() => {
  if (!cms) return props.fallbackAlt || ''
  return cms.getAlt(props.cmsSection!, props.cmsSlot!) || props.fallbackAlt || ''
})

onMounted(async () => {
  if (cms) await cms.load()
  setupParallax()
})

onUnmounted(() => teardownParallax())

// ── Parallax ─────────────────────────────────────────────────────────────────
const sectionRef = ref<HTMLElement | null>(null)
const imgRef     = ref<HTMLElement | null>(null)
const SPEED = 0.28   // fraction of scroll delta applied to image
const CLAMP = 100    // max px shift in either direction

let rafId: number | null = null
let ticking = false
let isMobile = false

function applyParallax() {
  if (isMobile || !sectionRef.value || !imgRef.value) return

  const rect = sectionRef.value.getBoundingClientRect()
  const wh   = window.innerHeight

  // Skip if not in view at all
  if (rect.bottom < -80 || rect.top > wh + 80) return

  const centerY = rect.top + rect.height / 2
  const delta   = (centerY - wh / 2) * SPEED
  const clamped = Math.max(-CLAMP, Math.min(CLAMP, delta))

  imgRef.value.style.transform = `translate3d(0, ${clamped}px, 0) scale(1.12)`
}

function onScroll() {
  if (ticking) return
  ticking = true
  rafId = requestAnimationFrame(() => { applyParallax(); ticking = false })
}

function setupParallax() {
  isMobile = window.innerWidth < 768
  applyParallax()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', () => { isMobile = window.innerWidth < 768; applyParallax() })
}

function teardownParallax() {
  window.removeEventListener('scroll', onScroll)
  if (rafId) cancelAnimationFrame(rafId)
}
</script>

<template>
  <section
    ref="sectionRef"
    class="page-hero"
    :style="`min-height: ${height}`"
  >
    <!-- Parallax image wrapper (overflow hidden is on .page-hero) -->
    <div class="page-hero__media">
      <img
        v-if="heroImage"
        ref="imgRef"
        :src="heroImage"
        :alt="heroAlt"
        class="page-hero__img"
        loading="eager"
        fetchpriority="high"
      />
      <NoImagePlaceholder v-else class="page-hero__placeholder" dark />
    </div>

    <!-- Gradient overlays -->
    <div class="page-hero__overlay-top"></div>
    <div class="page-hero__overlay-bottom"></div>

    <!-- Text slot -->
    <div class="page-hero__content">
      <p v-if="tag" class="page-hero__tag">{{ tag }}</p>
      <div class="page-hero__rule"></div>
      <h1 class="page-hero__title">
        {{ title }}
        <span v-if="titleItalic" class="page-hero__title-italic">{{ titleItalic }}</span>
      </h1>
      <p v-if="subtitle" class="page-hero__subtitle">{{ subtitle }}</p>
    </div>

    <!-- Allow callers to inject extra content (e.g. scroll arrow) -->
    <slot />
  </section>
</template>

<style scoped>
.page-hero {
  position: relative;
  display: flex;
  align-items: flex-end;
  overflow: hidden;   /* critical — clips the parallax overshoot */
  background: #071a2b;
  min-height: 60vh;
}

/* ── media wrapper ── */
.page-hero__media {
  position: absolute;
  inset: -14%;        /* extra space so parallax image never shows edges */
  z-index: 0;
}

.page-hero__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  will-change: transform;
  /* initial neutral position (parallax overrides in JS) */
  transform: translate3d(0, 0, 0) scale(1.12);
  /* smooth entrance */
  transition: opacity 0.6s ease;
}

.page-hero__placeholder {
  position: absolute;
  inset: 0;
}

/* ── overlays ── */
.page-hero__overlay-top {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: linear-gradient(
    to bottom,
    rgba(7, 26, 43, 0.45) 0%,
    rgba(7, 26, 43, 0.15) 40%,
    transparent 100%
  );
  pointer-events: none;
}

.page-hero__overlay-bottom {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: linear-gradient(
    to top,
    rgba(7, 26, 43, 0.94) 0%,
    rgba(7, 26, 43, 0.5) 35%,
    transparent 70%
  );
  pointer-events: none;
}

/* ── text ── */
.page-hero__content {
  position: relative;
  z-index: 2;
  width: 100%;
  padding: 0 1.5rem 4rem;
  max-width: 900px;
  margin: 0 auto;
}

@media (min-width: 1024px) {
  .page-hero__content { padding: 0 3rem 5rem; }
}

.page-hero__tag {
  font-family: var(--font-heading);
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: #C9A84C;
  margin-bottom: 1rem;
}

.page-hero__rule {
  width: 48px;
  height: 1px;
  background: rgba(201, 168, 76, 0.6);
  margin-bottom: 1.25rem;
}

.page-hero__title {
  font-family: var(--font-display);
  font-size: clamp(2.2rem, 6vw, 5rem);
  font-weight: 400;
  line-height: 1.08;
  color: #f8f5ef;
  letter-spacing: 0.01em;
}

.page-hero__title-italic {
  display: block;
  font-style: italic;
  color: #C9A84C;
}

.page-hero__subtitle {
  margin-top: 1rem;
  max-width: 44ch;
  font-family: var(--font-display);
  font-style: italic;
  font-size: 1.05rem;
  line-height: 1.7;
  color: rgba(248, 245, 239, 0.78);
}

/* Mobile — disable parallax scaling overhead */
@media (max-width: 767px) {
  .page-hero__media { inset: 0; }
  .page-hero__img   { transform: none !important; }
}
</style>
