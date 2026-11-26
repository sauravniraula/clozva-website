<script setup lang="ts">
import { ArrowDownRight, ArrowRight, ArrowUpRight, Menu, Search, ShoppingBag, X } from 'lucide-vue-next'
import { categories, money, freeShipping } from '#shared/catalog'
import { blogUrl } from '#shared/site-links'

const { count, isOpen } = useBag()
const route = useRoute()
const dialog = ref<HTMLDialogElement>()
const mode = ref<'menu' | 'search'>('menu')
const query = ref('')
const links = [{ label: 'Shop All', to: '/shop' }, ...categories.map(category => ({ label: category.name, to: `/shop?category=${category.id}` })), { label: 'Sale', to: '/shop?sale=1' }]
const router = useRouter()
const active = (to: string) => route.path === '/shop' && !route.query.q && route.query.category === router.resolve(to).query.category && route.query.sale === router.resolve(to).query.sale
async function open(next: typeof mode.value) {
  mode.value = next
  await nextTick()
  dialog.value?.showModal()
  if (next === 'search') dialog.value?.querySelector('input')?.focus()
}
function close() { dialog.value?.close() }
watch(() => route.fullPath, close)
async function search() {
  close()
  await navigateTo({ path: '/shop', query: query.value.trim() ? { q: query.value.trim() } : {} })
}
</script>

<template>
  <div class="announcement"><span class="announcement-star" aria-hidden="true">✳</span> Free U.S. shipping on orders {{ money(freeShipping) }}+ <ArrowDownRight :size="13" aria-hidden="true" /></div>
  <header class="site-header">
    <div class="header-inner">
      <button class="icon-btn menu-toggle" aria-label="Open menu" @click="open('menu')"><Menu :size="23" /></button>
      <NuxtLink to="/" class="wordmark" aria-label="CLOZVA home">clozva<span>.</span></NuxtLink>
      <nav class="desktop-nav" aria-label="Main navigation">
        <NuxtLink v-for="link in links" :key="link.to" :to="link.to" :class="{ active: active(link.to), 'sale-nav': link.label === 'Sale' }">{{ link.label }}</NuxtLink>
        <a :href="blogUrl">Blog</a>
      </nav>
      <div class="header-actions">
        <button class="icon-btn" aria-label="Search" @click="open('search')"><Search :size="22" :stroke-width="1.7" /></button>
        <button class="icon-btn bag-toggle" :aria-label="`Open shopping bag, ${count} items`" @click="isOpen = true"><ShoppingBag :size="22" :stroke-width="1.7" /><span>{{ count }}</span></button>
      </div>
    </div>
  </header>
  <dialog ref="dialog" class="menu-dialog" aria-labelledby="menu-title" @click.self="close">
    <div class="dialog-inner">
      <div class="dialog-heading"><h2 id="menu-title">{{ mode === 'search' ? 'Find your pair.' : 'Explore CLOZVA.' }}</h2><button class="icon-btn" aria-label="Close" @click="close"><X /></button></div>
      <form v-if="mode === 'search'" class="search-form" @submit.prevent="search">
        <input v-model="query" aria-label="Search products" placeholder="Try “sage” or “platform”" type="search" maxlength="100">
        <button class="btn btn-dark" type="submit">Search <ArrowRight :size="17" /></button>
      </form>
      <nav v-else class="menu-links" aria-label="Mobile navigation">
        <NuxtLink v-for="link in links" :key="link.to" :to="link.to" @click="close">{{ link.label }} <ArrowRight :size="19" /></NuxtLink>
        <a :href="blogUrl" @click="close">Blog <ArrowUpRight :size="19" aria-hidden="true" /></a>
      </nav>
    </div>
  </dialog>
</template>