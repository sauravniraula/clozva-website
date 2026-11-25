<script setup lang="ts">
import { ArrowUpRight } from 'lucide-vue-next'
import { money, productImage } from '#shared/catalog'
import type { Product } from '#shared/catalog'
defineProps<{ product: Product }>()
</script>

<template>
  <NuxtLink :to="`/products/${product.id}`" class="product-card">
    <div class="product-media">
      <img :src="productImage(product.image)" :alt="`${product.name} in ${product.color}${product.charms ? ' with clip-in charms' : ''}`" width="1024" height="1024" loading="lazy">
      <span v-if="product.compareAt || product.badge" class="product-badge" :class="{ lime: product.compareAt || product.badge === 'BESTSELLER' }">{{ product.compareAt ? 'SALE' : product.badge }}</span>
      <span class="product-arrow" aria-hidden="true"><ArrowUpRight :size="19" :stroke-width="1.8" /></span>
    </div>
    <div class="product-meta"><h3>{{ product.name }}</h3><div class="card-price"><strong>{{ money(product.price) }}</strong><del v-if="product.compareAt"><span class="sr-only">Original price: </span>{{ money(product.compareAt) }}</del></div><p><i :style="{ background: product.hex }" />{{ product.color }}</p></div>
  </NuxtLink>
</template>