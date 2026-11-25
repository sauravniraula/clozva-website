<script setup lang="ts">
import { ArrowDownToLine } from 'lucide-vue-next'
useSeoMeta({ title: 'Brand assets' })

const logos = [
  { id: 'wordmark', name: '01 / Wordmark', detail: 'The primary mark for storefronts and light surfaces.' },
  { id: 'tagline-lockup', name: '02 / Tagline lockup', detail: 'Wordmark and tagline for packaging and campaign sign-offs.' },
  { id: 'monogram', name: '03 / Monogram', detail: 'A compact mark for avatars, favicons, and small labels.' },
  { id: 'comfort-club', name: '04 / Comfort Club', detail: 'A round badge for stickers, inserts, and community posts.' },
]
const widths = [256, 512, 1024]
</script>

<template>
  <div>
    <div class="shop-banner"><div class="shell"><p class="eyebrow section-kicker"><span></span> CLOZVA / IDENTITY</p><h1>Brand assets.</h1><p>Four logo variants. Download the original vector or a PNG at the width you need.</p><span class="shop-star" aria-hidden="true">✳</span></div></div>
    <section class="shell section-block brand-grid" aria-label="Download CLOZVA logos">
      <article v-for="logo in logos" :key="logo.id" class="brand-card">
        <div class="brand-preview" :class="`logo-${logo.id}`"><img :src="`/brand/${logo.id}.svg`" :alt="`CLOZVA ${logo.id.replaceAll('-', ' ')}`"></div>
        <h2>{{ logo.name }}</h2><p>{{ logo.detail }}</p>
        <div class="brand-downloads"><a :href="`/brand/${logo.id}.svg`" download><ArrowDownToLine :size="15" /> SVG</a><a v-for="width in widths" :key="width" :href="`/brand/${logo.id}-${width}.png`" download :aria-label="`Download ${logo.name.split(' / ')[1]} PNG, ${width} pixels wide`">{{ width }} px</a></div>
      </article>
    </section>
  </div>
</template>
