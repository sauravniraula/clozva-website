<script setup lang="ts">
import { ArrowUpRight } from 'lucide-vue-next'
useStoreSeo({
  path: '/about',
  title: 'Our Story',
  description: 'Meet CLOZVA and discover why our first collection starts with an everyday foam clog, from the Classic to the Charm Edit.',
  image: '/images/club.webp',
  imageAlt: 'Sage clogs worn with cream socks on a sunny day',
})
</script>

<template>
  <article class="shell text-page">
    <p class="eyebrow section-kicker"><span></span> A NOTE FROM CLOZVA</p><h1>Take it easy.</h1>
    <p>CLOZVA (pronounced <em>kloz-vah</em>) starts with a simple idea: the shoes you feel best in should look as good as they feel.</p><p>Our first drop starts with an everyday foam clog. Classics for easy days, platforms for extra height, trail clogs for the long way home, and a Charm Edit for when your shoes want to say a little more.</p>
    <img src="/images/club.webp" alt="Sage clogs worn with cream socks on a sunny day" width="1280" height="1024">
    <NuxtLink to="/shop" class="btn btn-dark">Explore drop 001 <ArrowUpRight :size="18" /></NuxtLink>
  </article>
</template>