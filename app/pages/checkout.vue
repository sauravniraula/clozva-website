<script setup lang="ts">
import { ArrowLeft, ArrowRight } from 'lucide-vue-next'
import { currency, money, productImage, shippingFor } from '#shared/catalog'
import type { Customer, Receipt } from '#shared/catalog'
import { usStates } from '#shared/us-states'

useSeoMeta({ title: 'Checkout', robots: 'noindex' })
const { items, ready, clear, isOpen } = useBag()
const { lines, subtotal, status, refresh } = useBagLines()
const { data: storeStatus } = await useFetch('/api/store-status')
onMounted(() => { void refresh() })
const shipping = computed(() => shippingFor(subtotal.value))
const customer = reactive<Customer>({ name: '', email: '', phone: '', address: '', address2: '', city: '', state: '', postalCode: '', country: 'US' })
const submitting = ref(false)
const errorMessage = ref('')
const receipt = useState<Receipt | null>('latest-receipt', () => null)
const canOrder = computed(() => storeStatus.value?.checkout && ready.value && lines.value.length > 0 && lines.value.length === items.value.length && status.value === 'success')
let attempt: { payload: string; id: string } | undefined

async function checkout() {
  if (!canOrder.value || submitting.value) return
  submitting.value = true
  errorMessage.value = ''
  const payload = JSON.stringify({ customer, items: items.value })
  if (attempt?.payload !== payload) attempt = { payload, id: crypto.randomUUID() }
  try {
    const order = await $fetch<Receipt>('/api/orders', { method: 'POST', body: { requestId: attempt.id, customer, items: items.value } })
    receipt.value = order
    try { sessionStorage.setItem(`clozva:receipt:${order.id}`, order.token) } catch { /* Receipt is available until reload. */ }
    clear()
    await navigateTo(`/order/${order.id}`)
  } catch (failure) {
    const error = failure as { statusCode?: number; data?: { statusMessage?: string } }
    errorMessage.value = error.statusCode === 409 ? error.data?.statusMessage || 'Stock changed. Please check your bag.' : error.statusCode === 400 ? 'Check your shipping address and contact details, then try again.' : 'We couldn’t confirm the order. Please try again.'
    void refresh()
  } finally { submitting.value = false }
}
</script>

<template>
  <section class="shell checkout-page">
    <NuxtLink to="/shop" class="text-link"><ArrowLeft :size="17" /> Keep shopping</NuxtLink><p class="eyebrow section-kicker"><span></span> CLOZVA / CHECKOUT</p><h1>Almost yours.</h1>
    <div v-if="!storeStatus?.checkout" class="empty-state"><h2>Checkout is unavailable.</h2><p>You can still explore the collection and save items in your bag.</p><NuxtLink to="/shop" class="btn btn-dark">Keep browsing <ArrowRight :size="18" /></NuxtLink></div>
    <p v-else-if="!ready">Loading your bag…</p>
    <div v-else-if="!items.length" class="empty-state"><h2>Your bag is empty.</h2><NuxtLink to="/shop" class="btn btn-dark">Shop the clogs <ArrowRight :size="18" /></NuxtLink></div>
    <div v-else class="checkout-grid">
      <form class="checkout-form" @submit.prevent="checkout">
        <h2>Shipping address</h2>
        <div class="input-grid">
          <label class="wide">Full name<input v-model="customer.name" autocomplete="name" minlength="2" maxlength="100" required></label>
          <label>Email address<input v-model="customer.email" autocomplete="email" type="email" maxlength="254" required></label>
          <label>Phone number<input v-model="customer.phone" autocomplete="tel" type="tel" placeholder="(415) 555-0134" minlength="7" maxlength="25" required></label>
          <label class="wide">Street address<input v-model="customer.address" autocomplete="address-line1" minlength="5" maxlength="200" required></label>
          <label class="wide">Apartment, suite, etc. (optional)<input v-model="customer.address2" autocomplete="address-line2" maxlength="100"></label>
          <label>City<input v-model="customer.city" autocomplete="address-level2" minlength="2" maxlength="100" required></label>
          <div class="input-field"><label for="shipping-state">State</label><select id="shipping-state" v-model="customer.state" autocomplete="address-level1" required><option value="" disabled>Select a state</option><option v-for="(state, code) in usStates" :key="code" :value="code">{{ state }}</option></select></div>
          <label>ZIP code<input v-model="customer.postalCode" autocomplete="postal-code" inputmode="numeric" pattern="[0-9]{5}(-[0-9]{4})?" maxlength="10" required></label>
          <label>Country<input value="United States" autocomplete="country-name" readonly></label>
        </div>
        <p class="checkout-note">Preview checkout: use sample details. No payment is collected and no order will ship.</p>
        <p v-if="errorMessage" role="alert" class="form-error">{{ errorMessage }}</p>
        <button class="btn btn-dark full" type="submit" :disabled="submitting || !canOrder">{{ submitting ? 'Placing your order…' : 'Place order' }}<ArrowRight :size="18" /></button>
      </form>
      <aside class="order-summary"><div class="total-row"><h2>Order summary</h2><button class="plain-link" @click="isOpen = true">Edit bag</button></div>
        <p v-if="status === 'error'" role="alert">Couldn’t load your bag. <button class="plain-link" @click="refresh()">Retry</button></p>
        <p v-else-if="status === 'success' && lines.length !== items.length" role="alert">Some items are no longer available. Edit your bag to continue.</p>
        <div v-for="line in lines" :key="bagKey(line)" class="summary-line"><img :src="productImage(line.product.image)" :alt="line.product.color" width="74" height="68"><div><strong>{{ line.product.name }}</strong><p>{{ line.product.color }} · EU {{ line.size }} · Qty {{ line.quantity }}</p></div><strong>{{ money(line.product.price * line.quantity) }}</strong></div>
        <div class="summary-totals"><div class="total-row"><span>Subtotal</span><span>{{ money(subtotal) }}</span></div><div class="total-row"><span>Shipping</span><span>{{ shipping ? money(shipping) : 'Free' }}</span></div><div class="total-row grand-total"><strong>Total <small>{{ currency }}</small></strong><strong>{{ money(subtotal + shipping) }}</strong></div></div>
      </aside>
    </div>
  </section>
</template>