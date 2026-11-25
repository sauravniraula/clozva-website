<script setup lang="ts">
import { ArrowRight } from 'lucide-vue-next'
import type { NuxtError } from '#app'
defineProps<{ error: NuxtError }>()
</script>

<template>
  <div class="shell receipt-page">
    <p class="eyebrow">CLOZVA / {{ error.statusCode }}</p><h1>{{ error.statusCode === 404 ? 'Wrong turn.' : 'Something went wrong.' }}</h1>
    <p>{{ error.statusCode === 404 ? 'We couldn’t find that page or pair.' : 'The store couldn’t load this page. Try again from the shop.' }}</p>
    <button class="btn btn-dark" @click="clearError({ redirect: '/shop' })">Back to the shop <ArrowRight :size="18" /></button>
  </div>
</template>