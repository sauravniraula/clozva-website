<script setup lang="ts">
import { ArrowRight, Minus, Plus, ShoppingBag, X } from 'lucide-vue-next'
import { freeShipping, money, productImage } from '#shared/catalog'

const { isOpen, count, set, items } = useBag()
const { lines, subtotal, refresh, status } = useBagLines()
const dialog = ref<HTMLDialogElement>()
const route = useRoute()
watch(() => route.fullPath, () => { isOpen.value = false })
watch(isOpen, open => {
  if (open) { dialog.value?.showModal(); void refresh() }
  else dialog.value?.close()
})
</script>

<template>
  <dialog ref="dialog" class="bag-dialog" aria-labelledby="bag-title" @close="isOpen = false" @click.self="isOpen = false">
    <div class="bag-inner">
      <div class="dialog-heading"><h2 id="bag-title">Your bag <span>({{ count }})</span></h2><button class="icon-btn" aria-label="Close bag" @click="isOpen = false"><X /></button></div>
      <div v-if="count" class="bag-progress"><p>{{ subtotal >= freeShipping ? 'You unlocked free U.S. shipping.' : `You’re ${money(freeShipping - subtotal)} away from free U.S. shipping.` }}</p><progress :value="Math.min(subtotal, freeShipping)" :max="freeShipping" aria-label="Progress toward free U.S. shipping" /></div>
      <div v-if="!count" class="bag-empty"><ShoppingBag :size="37" :stroke-width="1.5" /><h3>Nothing in here yet.</h3><NuxtLink class="btn btn-lime" to="/shop" @click="isOpen = false">Explore the clogs <ArrowRight :size="18" /></NuxtLink></div>
      <div v-else class="bag-lines">
        <p v-if="status === 'error'" role="alert">We couldn’t load the latest stock. <button class="plain-link" @click="refresh()">Retry</button></p>
        <p v-else-if="!lines.length && status === 'pending'">Loading your bag…</p>
        <div v-for="line in lines" :key="bagKey(line)" class="bag-line">
          <NuxtLink :to="`/products/${line.id}`" @click="isOpen = false"><img :src="productImage(line.product.image)" :alt="line.product.color" width="100" height="88"></NuxtLink>
          <div><NuxtLink :to="`/products/${line.id}`" @click="isOpen = false"><strong>{{ line.product.name }}</strong></NuxtLink><p>{{ line.product.color }} · EU {{ line.size }}</p><div class="quantity"><button :aria-label="`Decrease ${line.product.color} quantity`" @click="set(line.id, line.size, line.quantity - 1)"><Minus :size="14" /></button><span>{{ line.quantity }}</span><button :aria-label="`Increase ${line.product.color} quantity`" :disabled="line.quantity >= (line.product.stock[line.size] ?? 0)" @click="set(line.id, line.size, line.quantity + 1)"><Plus :size="14" /></button></div></div>
          <div class="line-end"><strong>{{ money(line.product.price * line.quantity) }}</strong><button class="plain-link" @click="set(line.id, line.size, 0)">Remove</button></div>
        </div>
        <div v-for="line in items.filter(item => status === 'success' && !lines.some(available => bagKey(available) === bagKey(item)))" :key="bagKey(line)" class="unavailable">An item is no longer available. <button class="plain-link" @click="set(line.id, line.size, 0)">Remove</button></div>
      </div>
      <div v-if="count && lines.length" class="bag-bottom"><div class="total-row"><strong>Subtotal</strong><strong>{{ money(subtotal) }}</strong></div><p>Shipping calculated at checkout.</p><NuxtLink class="btn btn-dark full" to="/checkout" @click="isOpen = false">Checkout <ArrowRight :size="18" /></NuxtLink></div>
    </div>
  </dialog>
</template>