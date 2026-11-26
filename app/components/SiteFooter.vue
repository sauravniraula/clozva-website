<script setup lang="ts">
import { ArrowRight, ArrowUpRight } from 'lucide-vue-next'
import { currency } from '#shared/catalog'
import { blogUrl, socialProfiles } from '#shared/site-links'
const email = ref('')
const status = ref<'idle' | 'sending' | 'success' | 'error' | 'unavailable'>('idle')
async function subscribe() {
  if (status.value === 'sending') return
  status.value = 'sending'
  try { await $fetch('/api/newsletter', { method: 'POST', body: { email: email.value } }); status.value = 'success'; email.value = '' }
  catch (error) { status.value = (error as { statusCode?: number }).statusCode === 503 ? 'unavailable' : 'error' }
}
</script>

<template>
  <footer class="site-footer">
    <div class="shell footer-grid">
      <div class="footer-brand">
        <NuxtLink to="/" class="wordmark" aria-label="CLOZVA home">clozva<span>.</span></NuxtLink>
        <p>Comfort looks good.</p>
        <nav class="footer-social" aria-label="CLOZVA on social media">
          <a v-for="profile in socialProfiles" :key="profile.name" :href="profile.url">{{ profile.name }} <ArrowUpRight :size="13" aria-hidden="true" /></a>
        </nav>
      </div>
      <nav aria-label="Footer shop links"><h2>Explore</h2><NuxtLink to="/shop">Shop all</NuxtLink><NuxtLink to="/shop?category=classic">Classics</NuxtLink><NuxtLink to="/shop?category=platform">Platforms</NuxtLink><NuxtLink to="/shop?category=trail">Trail</NuxtLink><NuxtLink to="/shop?category=charm">Charm Edit</NuxtLink><NuxtLink to="/shop?sale=1">Sale</NuxtLink></nav>
      <nav aria-label="Footer help links"><h2>Good to know</h2><NuxtLink to="/about">Our story <ArrowUpRight :size="13" /></NuxtLink><a :href="blogUrl">Blog <ArrowUpRight :size="13" aria-hidden="true" /></a><NuxtLink to="/help#delivery">Shipping &amp; returns</NuxtLink><NuxtLink to="/help#sizing">Size guide</NuxtLink><NuxtLink to="/help#privacy">Privacy</NuxtLink><NuxtLink to="/brand">Brand assets</NuxtLink></nav>
      <div class="footer-news"><h2>Join the Comfort Club.</h2><p>New colorways and collection drops, straight to your inbox.</p><form v-if="status !== 'success' && status !== 'unavailable'" @submit.prevent="subscribe"><input v-model="email" type="email" placeholder="Your email address" aria-label="Email address for newsletter" maxlength="254" required><button type="submit" aria-label="Subscribe" :disabled="status === 'sending'"><ArrowRight :size="20" /></button></form><p v-if="status === 'success'" role="status">You’re on the list.</p><p v-if="status === 'error'" role="alert">Couldn’t subscribe. Check your email and try again.</p><p v-if="status === 'unavailable'" role="status">Newsletter signups are unavailable on this preview.</p></div>
    </div>
    <div class="shell footer-end"><span>© {{ new Date().getFullYear() }} CLOZVA</span><span>UNITED STATES · {{ currency }}</span></div>
  </footer>
</template>