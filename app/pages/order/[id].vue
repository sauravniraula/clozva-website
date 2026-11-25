<script setup lang="ts">
import { ArrowRight, Check } from 'lucide-vue-next'
import { money, productImage } from '#shared/catalog'
import type { Receipt } from '#shared/catalog'

useSeoMeta({ title: 'Order confirmation', robots: 'noindex' })
definePageMeta({ key: route => route.path })
const id = String(useRoute().params.id)
const latest = useState<Receipt | null>('latest-receipt', () => null)
const receipt = shallowRef<Omit<Receipt, 'token'> | null>(latest.value?.id === id ? latest.value : null)
const status = ref<'loading' | 'ready' | 'missing'>(receipt.value ? 'ready' : 'loading')
onMounted(async () => {
  if (receipt.value) return
  try {
    const token = sessionStorage.getItem(`clozva:receipt:${id}`)
    if (!token) { status.value = 'missing'; return }
    receipt.value = await $fetch<Omit<Receipt, 'token'>>(`/api/orders/${encodeURIComponent(id)}`, { headers: { 'x-receipt-token': token } })
    status.value = 'ready'
  } catch { status.value = 'missing' }
})
</script>

<template>
  <section class="shell receipt-page">
    <div v-if="receipt">
      <span class="success-icon"><Check :size="31" /></span><p class="eyebrow">ORDER {{ receipt.id }}</p><h1>You’re all set.</h1><p>Your preview order was saved. No payment was collected and no shipment will be created.</p>
      <div class="order-summary">
        <div v-for="line in receipt.items" :key="`${line.id}/${line.size}`" class="summary-line"><img :src="productImage(line.image)" :alt="line.color" width="74" height="68"><div><strong>{{ line.name }}</strong><p>{{ line.color }} · EU {{ line.size }} · Qty {{ line.quantity }}</p></div><strong>{{ money(line.price * line.quantity, receipt.currency) }}</strong></div>
        <div class="summary-totals"><div class="total-row"><span>Shipping</span><span>{{ receipt.shipping ? money(receipt.shipping, receipt.currency) : 'Free' }}</span></div><div class="total-row grand-total"><strong>Order total <small>{{ receipt.currency }}</small></strong><strong>{{ money(receipt.total, receipt.currency) }}</strong></div></div>
      </div>
    </div>
    <div v-else-if="status === 'loading'"><h1>Order confirmation.</h1><p>Loading your receipt…</p></div>
    <div v-else><h1>Receipt unavailable.</h1><p>Open the confirmation in the same browser tab used to place the order.</p></div>
    <NuxtLink to="/shop" class="btn btn-dark">Back to the shop <ArrowRight :size="18" /></NuxtLink>
  </section>
</template>