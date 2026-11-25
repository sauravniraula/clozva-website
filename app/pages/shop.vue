<script setup lang="ts">
import { ArrowRight, Search } from 'lucide-vue-next'
import { categories } from '#shared/catalog'
import type { Product } from '#shared/catalog'

const route = useRoute()
const activeCategory = computed(() => categories.find(category => category.id === route.query.category))
const sale = computed(() => route.query.sale === '1')
const query = computed(() => typeof route.query.q === 'string' ? route.query.q.slice(0, 100) : '')
const sort = computed(() => route.query.sort === 'price-asc' || route.query.sort === 'price-desc' ? route.query.sort : '')
const searchText = ref(query.value)
watch(query, value => { searchText.value = value })
const { data: products, status, refresh } = await useFetch<Product[]>('/api/products', { query: computed(() => ({ category: activeCategory.value?.id, q: query.value, sort: sort.value, sale: sale.value ? '1' : undefined })) })
const title = computed(() => query.value ? 'Search the drop.' : sale.value ? 'The Sale Edit.' : activeCategory.value?.title || 'Shop the drop.')
useSeoMeta({ title })
function filters(category?: string, q = query.value, order = sort.value, discounted = false) {
  return { path: '/shop', query: { category: category || undefined, q: q || undefined, sort: order || undefined, sale: discounted ? '1' : undefined } }
}
function sortBy(event: Event) { return navigateTo(filters(activeCategory.value?.id, query.value, (event.target as HTMLSelectElement).value, sale.value)) }
</script>

<template>
  <section>
    <div class="shop-banner" :class="{ 'sale-banner': sale }"><div class="shell"><p class="eyebrow section-kicker"><span></span> CLOZVA / DROP 001</p><h1>{{ title }}</h1><p>{{ query ? `Showing results for “${query}”` : sale ? 'Select colorways at a lower price, including clogs with charms.' : activeCategory?.description || 'From everyday classics to clogs with clip-in charms. Find the pair that feels like you.' }}</p><span class="shop-star" aria-hidden="true">✳</span></div></div>
    <div class="shell shop-body">
      <div class="shop-toolbar">
        <nav class="filter-tabs" aria-label="Filter by collection"><NuxtLink :to="filters()" :class="{ selected: !activeCategory && !sale }">All clogs</NuxtLink><NuxtLink v-for="category in categories" :key="category.id" :to="filters(category.id)" :class="{ selected: category.id === activeCategory?.id && !sale }">{{ category.name }}</NuxtLink><NuxtLink :to="filters(undefined, query, sort, true)" :class="{ selected: sale }">Sale</NuxtLink></nav>
        <form class="inline-search" @submit.prevent="navigateTo(filters(activeCategory?.id, searchText.trim(), sort, sale))"><input v-model="searchText" type="search" placeholder="Search styles" aria-label="Search styles" maxlength="100"><button class="icon-btn" aria-label="Submit product search"><Search :size="19" /></button></form>
      </div>
      <div class="shop-sort"><span aria-live="polite">{{ status === 'pending' ? 'Finding your pairs…' : status === 'success' ? `${products?.length || 0} ${products?.length === 1 ? 'style' : 'styles'}` : '' }}</span><label>Sort by <select aria-label="Sort products" :value="sort" @change="sortBy"><option value="">Featured</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option></select></label></div>
      <div v-if="status === 'error'" class="empty-state"><h2>We couldn’t load the shop.</h2><button class="btn btn-dark" @click="refresh()">Try again <ArrowRight :size="18" /></button></div>
      <div v-else-if="status === 'success' && !products?.length" class="empty-state"><h2>No pairs found.</h2><p>Try another search or see the full collection.</p><NuxtLink to="/shop" class="btn btn-dark">See all clogs <ArrowRight :size="18" /></NuxtLink></div>
      <div v-else-if="status === 'success'" class="products-grid"><ProductCard v-for="product in products" :key="product.id" :product="product" /></div>
    </div>
  </section>
</template>