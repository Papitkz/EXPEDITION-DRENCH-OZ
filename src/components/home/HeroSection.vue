<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useComponentCMS } from '@/composables/useComponentCMS'
import NoImagePlaceholder from '@/components/NoImagePlaceholder.vue'
import ToursSection from '../home/ToursSection.vue'

const cms = useComponentCMS('HeroSection')
const specialtyCms = useComponentCMS('SpecialtyExpeditionsSection')
const router = useRouter()

const videos = computed(() =>
  cms.getSection('heroVideos').map((item) => ({
    videoUrl: item.imageUrl || '',
    alt: item.alt || '',
    hasVideo: !!item.imageUrl,
  }))
)

// Limited Expeditions banner image (surfer girl, secluded Ningaloo wave) — slot 0 of SpecialtyExpeditionsSection
const limitedBannerImage = computed(() => specialtyCms.getSlot('specialtyCards', 1)?.imageUrl || '')

// Advanced video carousel state
const currentVideoIndex = ref(0)
const isTransitioning = ref(false)
const videoLoaded = ref(false)
const isPlaying = ref(true)
const showControls = ref(false)
const isHovering = ref(false)
const isMobile = ref(false)
const touchStartX = ref(0)
const touchEndX = ref(0)
const videoError = ref(false)
const isBuffering = ref(false)
const videoRef = ref<HTMLVideoElement | null>(null)
const showCenterPlay = ref(false)
const showPlayButton = ref(false)

let resizeObserver: ResizeObserver | null = null
let playAttemptInterval: number | null = null
let transitionTimeout: number | null = null
let hoverHideTimeout: number | null = null

onMounted(async () => {
  await cms.load()
  await specialtyCms.load()
  checkMobile()

  resizeObserver = new ResizeObserver(() => { checkMobile() })
  resizeObserver.observe(document.body)

  if (videoRef.value && videos.value[0]?.hasVideo) {
    videoRef.value.src = videos.value[0].videoUrl
    videoRef.value.load()
    if (isMobile.value) {
      isPlaying.value = false
      videoRef.value.pause()
    } else {
      forcePlay()
    }
  }

  showControls.value = true
  setTimeout(() => { if (!isHovering.value) showControls.value = false }, 4000)

  document.addEventListener('visibilitychange', handleVisibilityChange)

  playAttemptInterval = window.setInterval(() => {
    if (!isMobile.value && isPlaying.value && videoRef.value?.paused && !videoRef.value?.ended && !isTransitioning.value) {
      forcePlay()
    }
  }, 3000)
})

onUnmounted(() => {
  if (transitionTimeout) clearTimeout(transitionTimeout)
  if (hoverHideTimeout) clearTimeout(hoverHideTimeout)
  if (resizeObserver) resizeObserver.disconnect()
  if (playAttemptInterval) clearInterval(playAttemptInterval)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})

const checkMobile = () => { isMobile.value = window.innerWidth < 768 }

const currentVideoUrl = computed(() => videos.value[currentVideoIndex.value]?.videoUrl || '')
const nextVideoIndex = computed(() => (currentVideoIndex.value + 1) % videos.value.length)
const hasMultipleVideos = computed(() => videos.value.length > 1)

const preloadVideo = (url: string) => {
  const video = document.createElement('video')
  video.src = url
  video.preload = 'auto'
  video.muted = true
  video.load()
}

const forcePlay = async () => {
  if (!videoRef.value) return
  try {
    videoRef.value.muted = true
    await videoRef.value.play()
    isPlaying.value = true
    videoError.value = false
    isBuffering.value = false
    showCenterPlay.value = false
  } catch (err) {
    isPlaying.value = false
    if (isMobile.value) showCenterPlay.value = true
  }
}

const switchVideo = (newIndex: number) => {
  if (isTransitioning.value || newIndex === currentVideoIndex.value || !videoRef.value || !videos.value[newIndex]?.hasVideo) return
  isTransitioning.value = true
  isBuffering.value = true
  videoRef.value.style.opacity = '0.3'

  transitionTimeout = window.setTimeout(() => {
    currentVideoIndex.value = newIndex
    videoRef.value!.src = videos.value[newIndex].videoUrl
    videoRef.value!.load()

    const onCanPlay = () => {
      videoRef.value!.removeEventListener('canplaythrough', onCanPlay)
      videoRef.value!.style.opacity = '1'

      if (isMobile.value && !isPlaying.value) {
        videoRef.value!.pause()
        showCenterPlay.value = false
        isTransitioning.value = false
        isBuffering.value = false
      } else {
        forcePlay()
        isTransitioning.value = false
        isBuffering.value = false
      }

      if (videos.value[nextVideoIndex.value]?.hasVideo) preloadVideo(videos.value[nextVideoIndex.value].videoUrl)
    }

    videoRef.value!.addEventListener('canplaythrough', onCanPlay)
    setTimeout(() => { if (isTransitioning.value) onCanPlay() }, 3000)
  }, 300)
}

const nextVideo = () => switchVideo(nextVideoIndex.value)

const togglePlayPause = () => {
  isPlaying.value = !isPlaying.value
  if (isPlaying.value) {
    forcePlay()
  } else {
    videoRef.value?.pause()
    if (isMobile.value) showCenterPlay.value = true
  }
}

const handleCenterPlayClick = () => { togglePlayPause() }
const handleVideoEnded = () => {
  if (hasMultipleVideos.value) {
    nextVideo()
  } else if (videoRef.value) {
    videoRef.value.currentTime = 0
    forcePlay()
  }
}

const onTouchStart = (e: TouchEvent) => { touchStartX.value = e.changedTouches[0].screenX }
const onTouchEnd = (e: TouchEvent) => {
  touchEndX.value = e.changedTouches[0].screenX
  const diff = touchStartX.value - touchEndX.value
  if (Math.abs(diff) > 50) {
    if (diff > 0) nextVideo()
  }
}

const onMouseEnter = () => {
  isHovering.value = true
  showControls.value = true
  if (hoverHideTimeout) clearTimeout(hoverHideTimeout)
  if (!isMobile.value) showPlayButton.value = true
}

const onMouseLeave = () => {
  isHovering.value = false
  setTimeout(() => { if (!isHovering.value) showControls.value = false }, 2000)
  if (!isMobile.value) showPlayButton.value = false
}

const onHeroClick = () => { if (isMobile.value) showPlayButton.value = !showPlayButton.value }
const onVideoLoaded = () => { videoLoaded.value = true; if (videoRef.value) videoRef.value.style.opacity = '1' }
const onVideoPause = () => { if (isMobile.value) showCenterPlay.value = true }
const onVideoError = () => { videoError.value = true; setTimeout(() => { if (videoError.value && hasMultipleVideos.value) nextVideo() }, 2000) }
const handleVisibilityChange = () => { if (!document.hidden && isPlaying.value && !isMobile.value) forcePlay() }
</script>

<template>
  <section
    class="hero-section"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
    @touchstart="onTouchStart"
    @touchend="onTouchEnd"
    @click="onHeroClick"
  >
    <div class="hero-bg">
      <div class="video-container">
        <video
          v-if="videos[0]?.hasVideo"
          ref="videoRef"
          muted
          loop
          playsinline
          preload="auto"
          class="video-hero"
          :class="{ 'video-fade-in': videoLoaded, 'is-buffering': isBuffering }"
          @loadeddata="onVideoLoaded"
          @ended="handleVideoEnded"
          @error="onVideoError"
          @waiting="isBuffering = true"
          @playing="isBuffering = false; showCenterPlay = false"
          @pause="onVideoPause"
        >
          <source :src="currentVideoUrl" type="video/mp4">
        </video>
        <div v-else class="w-full h-full">
          <NoImagePlaceholder label="No Hero Video" class="w-full h-full" />
        </div>
        <div v-if="isBuffering" class="buffering-indicator">
          <div class="buffering-spinner"></div>
        </div>
      </div>
      <div class="overlay-dark"></div>
      <div class="overlay-gradient"></div>
    </div>

    <button
      v-if="videos[0]?.hasVideo && !isBuffering"
      @click.stop="handleCenterPlayClick"
      class="center-play-button"
      :class="{ 'is-visible': showPlayButton }"
      :aria-label="isPlaying ? 'Pause video' : 'Play video'"
    >
      <div class="play-circle">
        <svg v-if="!isPlaying" width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
      </div>
    </button>

    <div class="hero-content">
      <div class="headline-block">
        <h1 class="headline-main">
          <span class="block">WAKE UP ON THE</span>
          <span class="block">WORLD'S GREATEST REEF.</span>
        </h1>
        <div class="headline-rule">
          <span class="rule-line"></span>
          <svg width="18" height="18" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="78" fill="none" stroke="#C9A84C" stroke-width="1.5" opacity="0.7"/>
            <polygon points="100,28 108,100 100,113 92,100" fill="#C9A84C"/>
            <polygon points="100,172 108,100 100,87 92,100" fill="#C9A84C"/>
            <polygon points="28,100 100,92 113,100 100,108" fill="#C9A84C"/>
            <polygon points="172,100 100,92 87,100 100,108" fill="#C9A84C"/>
            <circle cx="100" cy="100" r="9" fill="#C9A84C"/>
          </svg>
          <span class="rule-line"></span>
        </div>
        <p class="headline-sub">
          <span class="headline-sub-line">Small-group expeditions exploring the Ningaloo Reef</span>
          <span class="headline-sub-line">by sail. Remote, wild and unforgettable.</span>
        </p>
      </div>

      <ToursSection />

      <div class="limited-banner">
        <div class="banner-text">
          <div class="banner-rule">
            <span class="rule-line"></span>
            <svg class="banner-compass" width="20" height="20" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="78" fill="none" stroke="#C9A84C" stroke-width="1.5" opacity="0.85"/>
              <polygon points="100,28 108,100 100,113 92,100" fill="#C9A84C"/>
              <polygon points="100,172 108,100 100,87 92,100" fill="#C9A84C"/>
              <polygon points="28,100 100,92 113,100 100,108" fill="#C9A84C"/>
              <polygon points="172,100 100,92 87,100 100,108" fill="#C9A84C"/>
              <circle cx="100" cy="100" r="9" fill="#C9A84C"/>
            </svg>
            <span class="rule-line"></span>
          </div>

          <h3 class="banner-heading">LOOKING FOR SOMETHING DIFFERENT?</h3>
          <p class="banner-sub">Selected dates are reserved for limited, hosted and specialty expeditions throughout the season.</p>

          <button class="btn-banner" @click.stop="router.push('/limited-expeditions')">
            VIEW LIMITED EXPEDITIONS
          </button>
        </div>

        <div class="banner-img-panel">
          <img
            v-if="limitedBannerImage"
            :src="limitedBannerImage"
            alt="Surfer riding a secluded wave at Ningaloo Reef"
            class="banner-img"
          />
          <NoImagePlaceholder v-else dark class="absolute inset-0" />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero-section {
  position: relative;
  width: 100%;
  min-height: 100dvh;
  background: #071a2b;
  overflow: hidden;
}

.hero-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.video-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.video-hero {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: opacity 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  will-change: opacity, transform;
}

.video-fade-in {
  opacity: 1;
  animation: slowZoom 20s ease-out forwards;
}

.video-hero.is-buffering { opacity: 0.5; }

@keyframes slowZoom {
  0%   { transform: scale(1) translate3d(0,0,0); }
  100% { transform: scale(1.10) translate3d(0, -3%, 0); }
}

.overlay-dark {
  position: absolute;
  inset: 0;
  background: rgba(7, 26, 43, 0.55);
}

.overlay-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(7,26,43,0.35) 0%,
    rgba(7,26,43,0.15) 30%,
    rgba(7,26,43,0.55) 70%,
    rgba(7,26,43,0.85) 100%
  );
}

.center-play-button {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 25;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.4s ease;
}

.center-play-button.is-visible { opacity: 1; pointer-events: auto; }

.play-circle {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: rgba(255,255,255,0.15);
  backdrop-filter: blur(8px);
  border: 2px solid rgba(255,255,255,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  transition: all 0.3s ease;
}

.center-play-button:hover .play-circle {
  background: rgba(255,255,255,0.25);
  transform: scale(1.08);
}

.buffering-indicator {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
  pointer-events: none;
}

.buffering-spinner {
  width: 40px;
  height: 40px;
  border: 2px solid rgba(201,168,76,0.3);
  border-top-color: #C9A84C;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.hero-content {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  padding: 0 1.5rem 2rem;
}

.headline-block {
  padding: 7rem 0 2.5rem;
  max-width: 700px;
}

.headline-main {
  font-family: var(--font-display);
  font-size: clamp(1.8rem, 5vw, 4rem);
  font-weight: 500;
  color: #f8f5ef;
  line-height: 1.1;
  letter-spacing: 0.02em;
  margin-bottom: 1.25rem;
}

.headline-main .block {
  display: block;
  white-space: nowrap;
}

.headline-rule {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  max-width: 260px;
}

.rule-line {
  flex: 1;
  height: 1px;
  background: rgba(201,168,76,0.5);
}

.headline-sub {
  color: rgba(248,245,239,0.75);
  font-size: 0.95rem;
  line-height: 1.65;
  max-width: 380px;
}

.headline-sub-line {
  display: block;
  white-space: nowrap;
}

@media (max-width: 420px) {
  .headline-sub-line {
    white-space: normal;
  }
}

.limited-banner {
  position: relative;
  display: grid;
  grid-template-columns: 1.05fr 1.45fr;
  align-items: center;
  min-height: 165px;
  background: linear-gradient(90deg, rgba(5, 20, 38, 0.98) 0%, rgba(5, 20, 38, 0.92) 42%, rgba(5, 20, 38, 0.08) 100%);
  border: 1px solid rgba(201, 168, 76, 0.55);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 0 0 1px rgba(201, 168, 76, 0.12) inset;
}

.banner-text {
  position: relative;
  z-index: 2;
  padding: 1.4rem 1.8rem 1.4rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.55rem;
}

.banner-rule {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  justify-content: center;
  margin-bottom: 0.1rem;
}

.banner-compass {
  flex: 0 0 auto;
  opacity: 0.95;
}

.banner-heading {
  font-family: var(--font-display);
  font-size: clamp(1.05rem, 1.8vw, 1.5rem);
  font-weight: 500;
  color: #f8f5ef;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  line-height: 1.15;
  margin: 0;
}

.banner-sub {
  color: rgba(248, 245, 239, 0.78);
  font-size: 0.82rem;
  line-height: 1.45;
  margin: 0;
  max-width: 440px;
}

.btn-banner {
  height: 38px;
  padding: 0 1.65rem;
  background: #c9a84c;
  color: #071a2b;
  border: none;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  cursor: pointer;
  border-radius: 2px;
  transition: background 0.3s ease, transform 0.3s ease;
  margin-top: 0.2rem;
}

.btn-banner:hover {
  background: #d7b461;
  transform: translateY(-2px);
}

.banner-img-panel {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 165px;
  overflow: hidden;
}

.banner-img-panel::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 1;
  background: linear-gradient(90deg, rgba(5, 20, 38, 0.08) 0%, rgba(5, 20, 38, 0) 35%, rgba(5, 20, 38, 0.15) 100%);
  pointer-events: none;
}

.banner-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  object-position: center center;
}

@media (max-width: 680px) {
  .hero-content {
    padding: 0 1rem 1.5rem;
  }

  .headline-block {
    padding: 5rem 0 1.75rem;
  }

  .headline-main {
    font-size: clamp(1.3rem, 6.5vw, 2.4rem);
  }

  .limited-banner {
    min-height: 150px;
    grid-template-columns: 1fr;
  }

  .banner-text {
    padding: 1.25rem 1.25rem;
  }

  .banner-img-panel {
    min-height: 180px;
    order: -1;
  }
}

@media (max-width: 767px) {
  .video-fade-in {
    animation: none !important;
    transform: none !important;
  }
}
.banner-img {
  /* fades the photo itself from invisible → fully visible, left to right */
  mask-image: linear-gradient(to right, transparent 0%, rgba(0,0,0,0.5) 18%, #000 45%);
  -webkit-mask-image: linear-gradient(to right, transparent 0%, rgba(0,0,0,0.5) 18%, #000 45%);
}

.banner-img-panel::before {
  /* reinforces it with a matching navy tint near the seam */
  background: linear-gradient(90deg, rgba(5,20,38,0.35) 0%, rgba(5,20,38,0.1) 30%, rgba(5,20,38,0) 55%);
}
</style>