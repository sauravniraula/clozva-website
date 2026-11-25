export default defineNuxtConfig({
  compatibilityDate: '2025-10-01',
  devtools: { enabled: false },
  // lucide-vue-next ships no "exports" map, so Node loads its CommonJS build at runtime,
  // which can't require() Vue's ES module in the Netlify function. Bundle its ESM build instead.
  build: { transpile: ['lucide-vue-next'] },
  runtimeConfig: { clozvaRequireDatabase: process.env.NITRO_PRESET === 'netlify' },
  css: ['@fontsource-variable/manrope/wght.css', '@fontsource-variable/space-grotesk/wght.css', '~/assets/css/main.css'],
  app: { head: { htmlAttrs: { lang: 'en-US' }, link: [{ rel: 'icon', type: 'image/svg+xml', href: '/brand/monogram.svg' }] } },
})