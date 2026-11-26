<script setup lang="ts">
useSeoMeta({ titleTemplate: title => title ? `${title} · CLOZVA` : 'CLOZVA — Comfort looks good.' })
const { restore } = useBag()
onMounted(restore)
</script>

<template>
  <div>
    <a class="skip" href="#main">Skip to content</a>
    <SiteHeader />
    <main id="main"><NuxtPage /></main>
    <SiteFooter />
    <BagDrawer />
  </div>
</template>