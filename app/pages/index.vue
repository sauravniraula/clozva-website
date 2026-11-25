<script setup lang="ts">
import { ArrowDownRight, ArrowRight, ArrowUpRight, Feather, Footprints, Wind } from 'lucide-vue-next'
import { categories, productImage } from '#shared/catalog'
import type { Product } from '#shared/catalog'

const { data: favorites, error, refresh } = await useFetch<Product[]>('/api/products', { query: { featured: '1' } })
useSeoMeta({ ogTitle: 'CLOZVA — Comfort looks good.', ogImage: '/images/campaign.webp' })
</script>

<template>
  <div>
    <section class="hero" aria-labelledby="hero-title">
      <div class="hero-copy">
        <div class="hero-content">
          <p class="eyebrow drop-label"><span></span> THE FIRST DROP <i></i> NO. 001</p>
          <h1 id="hero-title">Comfort<br>looks <em>good.</em></h1>
          <p class="hero-desc">Light on your feet. Loud in all the right ways. Meet the clogs you’ll reach for every day.</p>
          <NuxtLink class="btn btn-dark" to="/shop">Shop the drop <ArrowUpRight :size="18" /></NuxtLink>
        </div>
        <div class="hero-index"><span>DROP / 001</span><i></i><a href="#collections" aria-label="Scroll to collections"><ArrowDownRight :size="16" /></a></div>
      </div>
      <figure class="hero-visual">
        <img src="/images/campaign.webp" alt="Electric lime foam clogs against a sage green studio backdrop" width="1280" height="1280" fetchpriority="high">
        <span class="hero-sticker" aria-hidden="true"><span>MADE TO</span><b>✳</b><span>FEEL GOOD</span></span>
        <figcaption><span>FIG. 01</span><span>THE CLASSIC / ELECTRIC LIME</span></figcaption>
      </figure>
    </section>

    <section class="value-strip" aria-label="CLOZVA clog features">
      <span><Feather :size="19" /> LIGHTWEIGHT FOAM</span><b aria-hidden="true">✳</b><span><Wind :size="19" /> BREATHABLE BY DESIGN</span><b aria-hidden="true">✳</b><span><Footprints :size="19" /> SLIP ON. STEP OUT.</span>
    </section>

    <section id="collections" class="shell section-block">
      <header class="section-head"><div><p class="eyebrow section-kicker"><span></span> THE COLLECTIONS</p><h2>Find your stride.</h2></div><NuxtLink to="/shop" class="text-link">Shop all styles <ArrowUpRight :size="17" /></NuxtLink></header>
      <div class="collections-grid">
        <NuxtLink v-for="category in categories" :key="category.id" :to="`/shop?category=${category.id}`" class="collection-card" :class="category.tone">
          <div class="collection-media"><img :src="productImage(category.image)" :alt="''" width="1024" height="1024" loading="lazy"><span class="eyebrow">/ {{ category.number }}</span></div>
          <div class="collection-caption"><div><h3>{{ category.title }}</h3><p>{{ category.description }}</p></div><span class="round-arrow"><ArrowUpRight :size="20" /></span></div>
        </NuxtLink>
      </div>
    </section>

    <section class="bestsellers">
      <div class="shell section-block">
        <header class="section-head"><div><p class="eyebrow section-kicker"><span></span> THE CLOZVA SHORTLIST</p><h2>On heavy rotation.</h2></div><NuxtLink class="text-link" to="/shop">View the full drop <ArrowUpRight :size="17" /></NuxtLink></header>
        <p v-if="error" role="alert">The drop didn’t load. <button class="plain-link" @click="refresh()">Try again</button></p>
        <div v-else class="products-grid"><ProductCard v-for="product in favorites" :key="product.id" :product="product" /></div>
      </div>
    </section>

    <FeatureGraphics />

    <section class="shell section-block">
      <div class="editorial">
        <img src="/images/club.webp" alt="Sage clogs styled with ribbed cream socks on concrete steps" width="1280" height="1024" loading="lazy">
        <div class="editorial-copy"><p class="eyebrow">A NOTE FROM CLOZVA <span>✳</span></p><h2>Take it<br>easy.</h2><p>There’s no dress code for feeling good. We make clogs for the days you want to put something on and get on with it.</p><NuxtLink to="/about" class="btn btn-lime">Meet CLOZVA <ArrowRight :size="18" /></NuxtLink></div>
      </div>
    </section>
  </div>
</template>