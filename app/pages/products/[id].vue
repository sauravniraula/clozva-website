<script setup lang="ts">
import { ArrowLeft, ArrowRight, ChevronRight, Minus, Plus, Ruler, ShoppingBag, Sparkles, Truck } from 'lucide-vue-next'
import { categories, freeShipping, money, productImage, shippingFee, sizes } from '#shared/catalog'
import type { Product } from '#shared/catalog'

const route = useRoute()
definePageMeta({ key: route => route.path })
const id = String(route.params.id)
const { data, error } = await useFetch<Product>(`/api/products/${encodeURIComponent(id)}`)
if (!data.value) throw createError({ statusCode: error.value?.statusCode ?? 500, statusMessage: error.value?.statusCode === 404 ? 'Product not found' : 'Could not load this product', fatal: true })
const product = data.value
const category = categories.find(entry => entry.id === product.category)!
const { data: variants } = await useFetch<Product[]>('/api/products', { query: { category: category.id } })
useSeoMeta({ title: `${product.name} in ${product.color}`, description: product.description, ogImage: productImage(product.image) })
const { add, items } = useBag()
const selected = ref<number>()
const quantity = ref(1)
const message = ref('')
const available = Object.values(product.stock).some(quantity => quantity > 0)
const maxQuantity = computed(() => selected.value ? Math.max(0, Math.min(12, product.stock[selected.value] ?? 0) - (items.value.find(item => item.id === id && item.size === selected.value)?.quantity ?? 0)) : 12)
watch(selected, () => { message.value = ''; quantity.value = Math.min(quantity.value, Math.max(1, maxQuantity.value)) })
watch(maxQuantity, max => { quantity.value = Math.min(quantity.value, Math.max(1, max)) })
function addToBag() {
  if (!selected.value) { message.value = 'Choose a size first.'; return }
  if (!add(product, selected.value, quantity.value)) { message.value = 'There aren’t enough pairs left in this size. Try a smaller quantity or check your bag.'; return }
  message.value = ''
}
</script>

<template>
  <section class="shell detail">
    <nav class="breadcrumbs" aria-label="Breadcrumb"><NuxtLink to="/shop">Shop</NuxtLink><ChevronRight :size="13" /><NuxtLink :to="`/shop?category=${category.id}`">{{ category.name }}</NuxtLink><ChevronRight :size="13" /><span>{{ product.color }}</span></nav>
    <div class="detail-grid">
      <div class="detail-media"><img :src="productImage(product.image)" :alt="`${product.name} in ${product.color}${product.charms ? ' with clip-in charms' : ''}`" width="1024" height="1024" fetchpriority="high"><span v-if="product.compareAt || product.badge" class="product-badge lime">{{ product.compareAt ? 'SALE' : product.badge }}</span><span class="eyebrow detail-fig">CLOZVA / {{ category.number }}</span></div>
      <div class="detail-copy">
        <p class="eyebrow section-kicker"><span></span> {{ category.title.toUpperCase() }}</p><h1>{{ product.name }}</h1><div class="detail-price">{{ money(product.price) }} <del v-if="product.compareAt"><span class="sr-only">Original price: </span>{{ money(product.compareAt) }}</del><small v-if="product.compareAt">Save {{ money(product.compareAt - product.price) }}</small></div><p class="detail-description">{{ product.description }}</p>
        <div v-if="product.charms" class="charms-detail"><Sparkles :size="21" /><div><strong>Five clip-in charms included</strong><p>{{ product.charms }}</p></div></div>
        <p class="option-label">Color <span>— {{ product.color }}</span></p>
        <div class="swatches"><NuxtLink v-for="variant in variants" :key="variant.id" :to="`/products/${variant.id}`" :aria-label="variant.color" :title="variant.color" :aria-current="variant.id === id ? 'page' : undefined" :class="{ chosen: variant.id === id }"><span :style="{ background: variant.hex }"></span></NuxtLink></div>
        <div class="size-heading"><p id="size-label" class="option-label">Size (EU)</p><NuxtLink to="/help#sizing" class="plain-link"><Ruler :size="16" /> Size guide</NuxtLink></div>
        <div class="size-options" role="group" aria-labelledby="size-label"><button v-for="size in sizes" :key="size" :disabled="!product.stock[size]" :aria-pressed="selected === size" @click="selected = size">{{ size }}</button></div>
        <p v-if="message" class="form-error" role="alert">{{ message }}</p>
        <div class="purchase-row">
          <div class="quantity product-quantity" role="group" aria-label="Quantity"><button type="button" aria-label="Decrease quantity" :disabled="quantity <= 1" @click="quantity--"><Minus :size="16" /></button><output aria-live="polite" aria-label="Selected quantity">{{ quantity }}</output><button type="button" aria-label="Increase quantity" :disabled="quantity >= maxQuantity" @click="quantity++"><Plus :size="16" /></button></div>
          <button type="button" class="btn btn-dark full add-button" :disabled="!available" @click="addToBag"><ShoppingBag :size="19" /> {{ available ? 'Add to bag' : 'Sold out' }} <ArrowRight class="push" :size="19" /></button>
        </div>
        <p class="product-shipping"><Truck :size="19" /> {{ money(shippingFee) }} U.S. shipping · Free on orders {{ money(freeShipping) }}+</p>
        <details class="faq"><summary>Materials &amp; care</summary><p>Molded foam upper and sole. Wipe clean with mild soap and water, then let them air-dry out of direct sunlight.</p></details>
        <details class="faq"><summary>Shipping &amp; returns</summary><p>Checkout accepts U.S. addresses only. <NuxtLink to="/help#delivery" class="plain-link">See shipping information</NuxtLink>.</p></details>
      </div>
    </div>
    <NuxtLink class="text-link back-link" to="/shop"><ArrowLeft :size="18" /> Back to the full drop</NuxtLink>
  </section>
</template>