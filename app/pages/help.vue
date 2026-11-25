<script setup lang="ts">
import { freeShipping, money, shippingFee } from '#shared/catalog'
useSeoMeta({ title: 'Shipping, sizing & privacy' })
</script>

<template>
  <article class="shell text-page">
    <p class="eyebrow section-kicker"><span></span> THE CLOZVA GUIDE</p><h1>Good to know.</h1>
    <section id="delivery"><h2>Shipping &amp; returns</h2><p>Checkout accepts U.S. addresses in all 50 states and Washington, D.C. Standard shipping is {{ money(shippingFee) }} and is free on orders of {{ money(freeShipping) }} or more.</p><p>This preview saves orders but does not collect payments or ship products. Shipping timelines and the return policy will be published before launch.</p></section>
    <section id="sizing"><h2>Size guide</h2><p>Our unisex clogs use EU sizes 36–44. Start with your usual EU size. If you’re between sizes, consider sizing up, especially if you plan to wear thick socks.</p></section>
    <section id="privacy"><h2>Privacy</h2><p>Your bag is saved in this browser. If you submit an order, this store saves the contact and delivery details you enter along with the order. The receipt stays available in the tab where you checked out.</p><p>The newsletter form stores your email address but does not send emails from this preview. Use test information when trying the storefront.</p></section>
  </article>
</template>