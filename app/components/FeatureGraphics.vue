<script setup lang="ts">
import { ArrowUpRight } from 'lucide-vue-next'
const features = [
  { title: 'Lightweight foam', image: 'feature-lightweight', alt: 'Lime clog and a small feather floating against a sage backdrop', copy: 'Soft molded foam keeps the pair light on your feet.', to: '/shop?category=classic' },
  { title: 'Room to breathe', image: 'feature-airflow', alt: 'Close-up of the ventilation ports on a sage clog', copy: 'Open ports let air move through the upper.', to: '/shop?category=platform' },
  { title: 'Grip on the go', image: 'feature-grip', alt: 'Detail of a charcoal trail clog’s lugged outsole', copy: 'Deep lugs give the Trail Edit extra tread underfoot.', to: '/shop?category=trail' },
  { title: 'Clip in some color', image: 'feature-charms', alt: 'Colorful clip-in charms fitted to an ivory clog', copy: 'Move the Charm Edit’s clip-in pieces to make your own mix.', to: '/shop?category=charm' },
]
</script>

<template>
  <section id="features" class="features-section">
    <div class="shell section-block">
      <header class="section-head"><div><p class="eyebrow section-kicker"><span></span> UNDER THE UPPER</p><h2>It’s in the details.</h2></div></header>
      <div class="features-grid">
        <article v-for="(feature, index) in features" :key="feature.image" class="feature-card">
          <NuxtLink :to="feature.to"><figure><img :src="`/images/${feature.image}.webp`" :alt="feature.alt" width="1024" height="1024" loading="lazy"><span class="eyebrow">0{{ index + 1 }}</span></figure>
          <div><h3>{{ feature.title }}</h3><ArrowUpRight :size="19" /></div></NuxtLink>
          <p>{{ feature.copy }}</p>
        </article>
      </div>
    </div>
  </section>
</template>
