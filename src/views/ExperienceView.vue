<script setup lang="ts">
import { computed } from 'vue'
import { useSEO } from '@/composables/useSEO'
import { useScrollReveal } from '@/composables/useScrollReveal'
import { useComponentCMS } from '@/composables/useComponentCMS'
import PageHero from '@/components/PageHero.vue'
import EditableText from '@/components/EditableText.vue'
import CtaSection from '@/components/home/CtaSection.vue'

useScrollReveal()

const heroCms = useComponentCMS('ExperienceView')
const heroImage = computed(() => heroCms.getImageUrl('hero', 0))

useSEO({
  title: 'The Experience — Expedition OZ',
  description: 'What it feels like to sail Ningaloo Reef aboard Expedition OZ — small-group, all-inclusive, guided by marine naturalists.',
  type: 'website',
  keywords: ['Ningaloo Reef experience', 'sailing expedition', 'Expedition OZ', 'whale shark snorkeling'],
})

const pillars = [
  { key: 'pillar1', icon: 'compass', defaultTitle: 'Guided by Naturalists', defaultDesc: 'Every excursion is led by marine naturalists who read the water, the weather, and the wildlife — so you experience the reef the way it deserves to be seen.' },
  { key: 'pillar2', icon: 'wave', defaultTitle: 'Small-Group, All-Inclusive', defaultDesc: 'A handful of guests aboard, never a crowd. Meals, gear, and excursions are all included, so the only thing you need to plan is which sunset to watch from the deck.' },
  { key: 'pillar3', icon: 'compass', defaultTitle: 'Days Shaped by the Sea', defaultDesc: 'No two days look alike. Itineraries flex around wildlife movements, tides, and weather, so every expedition is its own story.' },
]
</script>

<template>
  <div class="experience-page">
    <PageHero
      component-name="ExperienceView"
      :fallback-image="heroImage || '/images/sylvia-hero.jpg'"
      fallback-alt="Sailing the Ningaloo Reef"
      title="The Experience"
      subtitle="What it feels like to spend your days at sea"
    />

    <section class="exp-intro" data-reveal>
      <div class="exp-intro-inner">
        <h2 class="exp-intro-title">
          <EditableText page="experience" section="intro" content-key="title" tag="span">
            More Than a Trip. A Rhythm.
          </EditableText>
        </h2>
        <p class="exp-intro-desc">
          <EditableText page="experience" section="intro" content-key="description" tag="span">
            Expedition OZ isn't a checklist of sights — it's days that move with the ocean's own rhythm. Wake to the sound of water against the hull, spend mornings in the wake of whale sharks and manta rays, and end each evening with the sky turning gold over Ningaloo Reef.
          </EditableText>
        </p>
      </div>
    </section>

    <section class="exp-pillars">
      <div
        v-for="pillar in pillars"
        :key="pillar.key"
        class="exp-pillar"
        data-reveal
      >
        <div class="exp-pillar-icon" aria-hidden="true">
          <svg width="36" height="36" viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r="36" stroke="currentColor" stroke-width="1.5" opacity="0.5" />
            <polygon points="40,16 37,40 40,44 43,40" fill="currentColor" />
          </svg>
        </div>
        <h3 class="exp-pillar-title">
          <EditableText page="experience" :section="pillar.key" content-key="title" tag="span">
            {{ pillar.defaultTitle }}
          </EditableText>
        </h3>
        <p class="exp-pillar-desc">
          <EditableText page="experience" :section="pillar.key" content-key="description" tag="span">
            {{ pillar.defaultDesc }}
          </EditableText>
        </p>
      </div>
    </section>

    <CtaSection />
  </div>
</template>

<style scoped>
.experience-page {
  background: var(--color-ocean-950, #071a2b);
}

.exp-intro {
  padding: 5rem 1.5rem;
  text-align: center;
}

.exp-intro-inner {
  max-width: 760px;
  margin: 0 auto;
}

.exp-intro-title {
  font-family: var(--font-display, 'Montserrat', sans-serif);
  font-size: clamp(1.75rem, 4vw, 2.75rem);
  color: var(--color-gold-400, #c9a84c);
  margin-bottom: 1.5rem;
  font-weight: 600;
}

.exp-intro-desc {
  font-size: 1.05rem;
  line-height: 1.8;
  color: var(--color-text-muted, #c7d2da);
}

.exp-pillars {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2.5rem;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem 5rem;
}

.exp-pillar {
  text-align: center;
  padding: 2.5rem 1.5rem;
  border: 1px solid rgba(201, 168, 76, 0.18);
  border-radius: 6px;
  transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.4s ease, background 0.4s ease;
}

.exp-pillar:hover {
  transform: translateY(-6px);
  border-color: rgba(201, 168, 76, 0.5);
  background: rgba(201, 168, 76, 0.04);
}

.exp-pillar-icon {
  color: var(--color-gold-400, #c9a84c);
  margin-bottom: 1.25rem;
  display: flex;
  justify-content: center;
}

.exp-pillar-title {
  font-family: var(--font-heading, 'Montserrat', sans-serif);
  font-size: 1.15rem;
  letter-spacing: 0.03em;
  color: #fff;
  margin-bottom: 0.85rem;
}

.exp-pillar-desc {
  font-size: 0.92rem;
  line-height: 1.7;
  color: var(--color-text-muted, #c7d2da);
}

/* ===== Responsive ===== */
@media (max-width: 1024px) {
  .exp-pillars {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .exp-intro {
    padding: 3.5rem 1.25rem;
  }
  .exp-pillars {
    grid-template-columns: 1fr;
    gap: 1.5rem;
    padding: 0 1.25rem 3.5rem;
  }
  .exp-pillar {
    padding: 2rem 1.25rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .exp-pillar {
    transition: none;
  }
}
</style>
